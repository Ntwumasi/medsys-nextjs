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

// GET - Fetch allergies for a patient
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status') || 'active';

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const result = await query(`
      SELECT a.*,
             u.first_name as recorded_by_first_name,
             u.last_name as recorded_by_last_name
      FROM allergies a
      LEFT JOIN users u ON a.recorded_by = u.id
      WHERE a.patient_id = $1 AND a.status = $2
      ORDER BY a.severity DESC, a.created_at DESC
    `, [parseInt(patientId), status]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching allergies:', error);
    return NextResponse.json({ error: 'Failed to fetch allergies' }, { status: 500 });
  }
}

// POST - Create new allergy
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      allergen,
      allergenType,
      reaction,
      severity,
      onsetDate,
      notes
    } = body;

    if (!patientId || !allergen) {
      return NextResponse.json({ error: 'Patient ID and allergen are required' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO allergies (
        patient_id, allergen, allergen_type, reaction, severity,
        onset_date, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      patientId, allergen, allergenType || null, reaction || null,
      severity || null, onsetDate || null, notes || null, user.userId
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating allergy:', error);
    return NextResponse.json({ error: 'Failed to create allergy' }, { status: 500 });
  }
}

// PUT - Update allergy
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      allergen,
      allergenType,
      reaction,
      severity,
      onsetDate,
      status,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await query(`
      UPDATE allergies SET
        allergen = $1,
        allergen_type = $2,
        reaction = $3,
        severity = $4,
        onset_date = $5,
        status = $6,
        notes = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [
      allergen, allergenType || null, reaction || null,
      severity || null, onsetDate || null, status || 'active',
      notes || null, id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating allergy:', error);
    return NextResponse.json({ error: 'Failed to update allergy' }, { status: 500 });
  }
}

// DELETE - Delete allergy
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
      'DELETE FROM allergies WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting allergy:', error);
    return NextResponse.json({ error: 'Failed to delete allergy' }, { status: 500 });
  }
}
