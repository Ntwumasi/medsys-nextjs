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

// GET - Fetch prescriptions for a patient
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('encounterId');
    const status = searchParams.get('status') || 'active';
    const limit = searchParams.get('limit') || '100';

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    let queryStr = `
      SELECT p.*,
             u.first_name as prescriber_first_name,
             u.last_name as prescriber_last_name
      FROM prescriptions p
      LEFT JOIN users u ON p.prescriber_id = u.id
      WHERE p.patient_id = $1 AND p.status = $2
    `;
    const params: unknown[] = [parseInt(patientId), status];

    if (encounterId) {
      queryStr += ` AND p.encounter_id = $${params.length + 1}`;
      params.push(parseInt(encounterId));
    }

    queryStr += ` ORDER BY p.prescription_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

// POST - Create new prescription
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
      medicationName,
      genericName,
      dosage,
      form,
      route,
      frequency,
      duration,
      quantity,
      refills,
      indication,
      instructions,
      dispenseAsWritten
    } = body;

    if (!patientId || !medicationName || !dosage || !frequency) {
      return NextResponse.json({
        error: 'Patient ID, medication name, dosage, and frequency are required'
      }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO prescriptions (
        patient_id, encounter_id, prescriber_id, medication_name, generic_name,
        dosage, form, route, frequency, duration, quantity, refills,
        indication, instructions, dispense_as_written
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      patientId, encounterId || null, user.userId, medicationName, genericName || null,
      dosage, form || null, route || null, frequency, duration || null,
      quantity || null, refills || 0, indication || null, instructions || null,
      dispenseAsWritten || false
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}

// PUT - Update prescription status
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const result = await query(`
      UPDATE prescriptions SET
        status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
  }
}

// DELETE - Delete prescription
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await query(
      'DELETE FROM prescriptions WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 });
  }
}
