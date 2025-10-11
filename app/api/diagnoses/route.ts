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

// GET - Fetch diagnoses (problem list) for a patient
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status') || 'active';
    const encounterId = searchParams.get('encounterId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    let queryStr = `
      SELECT d.*,
             u.first_name as recorded_by_first_name,
             u.last_name as recorded_by_last_name
      FROM diagnoses d
      LEFT JOIN users u ON d.recorded_by = u.id
      WHERE d.patient_id = $1 AND d.status = $2
    `;
    const params: unknown[] = [parseInt(patientId), status];

    if (encounterId) {
      queryStr += ` AND d.encounter_id = $${params.length + 1}`;
      params.push(parseInt(encounterId));
    }

    queryStr += ` ORDER BY d.created_at DESC`;

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching diagnoses:', error);
    return NextResponse.json({ error: 'Failed to fetch diagnoses' }, { status: 500 });
  }
}

// POST - Create new diagnosis
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
      diagnosisCode,
      diagnosisName,
      diagnosisType,
      onsetDate,
      severity,
      notes
    } = body;

    if (!patientId || !diagnosisName) {
      return NextResponse.json({
        error: 'Patient ID and diagnosis name are required'
      }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO diagnoses (
        patient_id, encounter_id, diagnosis_code, diagnosis_name,
        diagnosis_type, onset_date, severity, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      patientId, encounterId || null, diagnosisCode || null, diagnosisName,
      diagnosisType || null, onsetDate || null, severity || null,
      notes || null, user.userId
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    return NextResponse.json({ error: 'Failed to create diagnosis' }, { status: 500 });
  }
}

// PUT - Update diagnosis
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      diagnosisCode,
      diagnosisName,
      diagnosisType,
      onsetDate,
      resolutionDate,
      status,
      severity,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await query(`
      UPDATE diagnoses SET
        diagnosis_code = $1,
        diagnosis_name = $2,
        diagnosis_type = $3,
        onset_date = $4,
        resolution_date = $5,
        status = $6,
        severity = $7,
        notes = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      diagnosisCode || null, diagnosisName, diagnosisType || null,
      onsetDate || null, resolutionDate || null, status || 'active',
      severity || null, notes || null, id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Diagnosis not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating diagnosis:', error);
    return NextResponse.json({ error: 'Failed to update diagnosis' }, { status: 500 });
  }
}

// DELETE - Delete diagnosis
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
      'DELETE FROM diagnoses WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Diagnosis not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diagnosis:', error);
    return NextResponse.json({ error: 'Failed to delete diagnosis' }, { status: 500 });
  }
}
