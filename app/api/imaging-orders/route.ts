import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) as count FROM imaging_orders WHERE EXTRACT(YEAR FROM ordered_at) = $1`,
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `IMG-${year}-${count.toString().padStart(5, '0')}`;
}

// GET
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let queryStr = `
      SELECT io.*, ist.study_name, ist.modality, ist.body_part,
             p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM imaging_orders io
      LEFT JOIN imaging_study_catalog ist ON io.study_id = ist.id
      LEFT JOIN patients p ON io.patient_id = p.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (patientId) {
      queryStr += ` AND io.patient_id = $${params.length + 1}`;
      params.push(parseInt(patientId));
    }

    queryStr += ` ORDER BY io.ordered_at DESC`;
    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { patientId, encounterId, studyId, priority = 'routine', clinicalIndication } = await request.json();

    if (!patientId || !studyId || !clinicalIndication) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const orderNumber = await generateOrderNumber();
    const result = await query(
      `INSERT INTO imaging_orders (
        order_number, patient_id, encounter_id, ordering_provider_id,
        study_id, priority, clinical_indication, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orderNumber, patientId, encounterId || null, user.userId, studyId, priority, clinicalIndication, 'ordered']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
