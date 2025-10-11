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

// GET - Fetch medical history for a patient
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const historyType = searchParams.get('historyType');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    let queryStr = `
      SELECT mh.*,
             u.first_name as recorded_by_first_name,
             u.last_name as recorded_by_last_name
      FROM medical_history mh
      LEFT JOIN users u ON mh.recorded_by = u.id
      WHERE mh.patient_id = $1
    `;
    const params: unknown[] = [parseInt(patientId)];

    if (historyType) {
      queryStr += ` AND mh.history_type = $${params.length + 1}`;
      params.push(historyType);
    }

    queryStr += ` ORDER BY mh.created_at DESC`;

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return NextResponse.json({ error: 'Failed to fetch medical history' }, { status: 500 });
  }
}

// POST - Create medical history entry
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      historyType,
      conditionName,
      diagnosisDate,
      status,
      notes
    } = body;

    if (!patientId || !historyType) {
      return NextResponse.json({
        error: 'Patient ID and history type are required'
      }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO medical_history (
        patient_id, history_type, condition_name, diagnosis_date,
        status, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      patientId, historyType, conditionName || null, diagnosisDate || null,
      status || null, notes || null, user.userId
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating medical history:', error);
    return NextResponse.json({ error: 'Failed to create medical history' }, { status: 500 });
  }
}

// PUT - Update medical history entry
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      historyType,
      conditionName,
      diagnosisDate,
      status,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await query(`
      UPDATE medical_history SET
        history_type = $1,
        condition_name = $2,
        diagnosis_date = $3,
        status = $4,
        notes = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [
      historyType, conditionName || null, diagnosisDate || null,
      status || null, notes || null, id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Medical history entry not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating medical history:', error);
    return NextResponse.json({ error: 'Failed to update medical history' }, { status: 500 });
  }
}

// DELETE - Delete medical history entry
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
      'DELETE FROM medical_history WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Medical history entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medical history:', error);
    return NextResponse.json({ error: 'Failed to delete medical history' }, { status: 500 });
  }
}
