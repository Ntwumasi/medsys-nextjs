import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

function verifyAuth(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Generate claim number
async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) as count FROM insurance_claims WHERE EXTRACT(YEAR FROM claim_date) = $1`,
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `CLM-${year}-${count.toString().padStart(5, '0')}`;
}

// GET - Fetch insurance claims
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let queryStr = `
      SELECT ic.*,
             p.first_name as patient_first_name,
             p.last_name as patient_last_name,
             p.patient_number,
             i.invoice_number,
             e.encounter_type,
             u.first_name as created_by_first_name,
             u.last_name as created_by_last_name
      FROM insurance_claims ic
      LEFT JOIN patients p ON ic.patient_id = p.id
      LEFT JOIN invoices i ON ic.invoice_id = i.id
      LEFT JOIN encounters e ON ic.encounter_id = e.id
      LEFT JOIN users u ON ic.created_by = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (patientId) {
      queryStr += ` AND ic.patient_id = $${params.length + 1}`;
      params.push(parseInt(patientId));
    }

    if (status) {
      queryStr += ` AND ic.status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY ic.claim_date DESC, ic.created_at DESC`;

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}

// POST - Create new insurance claim
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      encounterId,
      invoiceId,
      insuranceCompany,
      policyNumber,
      groupNumber,
      subscriberName,
      subscriberRelationship,
      serviceDate,
      diagnosisCodes,
      procedureCodes,
      totalCharged,
      notes
    } = body;

    if (!patientId || !insuranceCompany || !policyNumber || !serviceDate || !totalCharged) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    const claimNumber = await generateClaimNumber();

    const result = await query(
      `INSERT INTO insurance_claims (
        claim_number, patient_id, encounter_id, invoice_id,
        insurance_company, policy_number, group_number,
        subscriber_name, subscriber_relationship,
        service_date, diagnosis_codes, procedure_codes,
        total_charged, status, submission_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_DATE, $15, $16)
      RETURNING *`,
      [
        claimNumber,
        patientId,
        encounterId || null,
        invoiceId || null,
        insuranceCompany,
        policyNumber,
        groupNumber || null,
        subscriberName || null,
        subscriberRelationship || 'Self',
        serviceDate,
        diagnosisCodes || [],
        procedureCodes || [],
        totalCharged,
        'submitted',
        notes || null,
        user.userId
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating claim:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}

// PUT - Update insurance claim
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      amountApproved,
      amountPaid,
      patientResponsibility,
      responseDate,
      denialReason,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE insurance_claims SET
        status = COALESCE($1, status),
        amount_approved = COALESCE($2, amount_approved),
        amount_paid = COALESCE($3, amount_paid),
        patient_responsibility = COALESCE($4, patient_responsibility),
        response_date = COALESCE($5, response_date),
        denial_reason = COALESCE($6, denial_reason),
        notes = COALESCE($7, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        status || null,
        amountApproved || null,
        amountPaid || null,
        patientResponsibility || null,
        responseDate || null,
        denialReason || null,
        notes || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}
