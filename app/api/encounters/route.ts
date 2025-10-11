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

// GET - Fetch encounters for a patient
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('id');
    const limit = searchParams.get('limit') || '50';

    if (encounterId) {
      // Fetch single encounter
      const result = await query(`
        SELECT e.*,
               p.first_name as provider_first_name,
               p.last_name as provider_last_name,
               s.first_name as signed_by_first_name,
               s.last_name as signed_by_last_name,
               pat.first_name as patient_first_name,
               pat.last_name as patient_last_name
        FROM encounters e
        LEFT JOIN users p ON e.provider_id = p.id
        LEFT JOIN users s ON e.signed_by = s.id
        LEFT JOIN patients pat ON e.patient_id = pat.id
        WHERE e.id = $1
      `, [parseInt(encounterId)]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Fetch all encounters for patient
    const result = await query(`
      SELECT e.*,
             p.first_name as provider_first_name,
             p.last_name as provider_last_name,
             s.first_name as signed_by_first_name,
             s.last_name as signed_by_last_name
      FROM encounters e
      LEFT JOIN users p ON e.provider_id = p.id
      LEFT JOIN users s ON e.signed_by = s.id
      WHERE e.patient_id = $1
      ORDER BY e.encounter_date DESC
      LIMIT $2
    `, [parseInt(patientId), parseInt(limit as string)]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json({ error: 'Failed to fetch encounters' }, { status: 500 });
  }
}

// POST - Create new encounter
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      appointmentId,
      encounterType,
      chiefComplaint,
      historyPresentIllness,
      reviewOfSystems,
      physicalExamination,
      assessment,
      plan
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO encounters (
        patient_id, appointment_id, provider_id, encounter_date,
        encounter_type, chief_complaint, history_present_illness,
        review_of_systems, physical_examination, assessment, plan, status
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *
    `, [
      patientId,
      appointmentId || null,
      user.userId,
      encounterType || null,
      chiefComplaint || null,
      historyPresentIllness || null,
      reviewOfSystems || null,
      physicalExamination || null,
      assessment || null,
      plan || null
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating encounter:', error);
    return NextResponse.json({ error: 'Failed to create encounter' }, { status: 500 });
  }
}

// PUT - Update encounter
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      encounterType,
      chiefComplaint,
      historyPresentIllness,
      reviewOfSystems,
      physicalExamination,
      assessment,
      plan,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Encounter ID is required' }, { status: 400 });
    }

    const result = await query(`
      UPDATE encounters SET
        encounter_type = $1,
        chief_complaint = $2,
        history_present_illness = $3,
        review_of_systems = $4,
        physical_examination = $5,
        assessment = $6,
        plan = $7,
        status = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      encounterType || null,
      chiefComplaint || null,
      historyPresentIllness || null,
      reviewOfSystems || null,
      physicalExamination || null,
      assessment || null,
      plan || null,
      status || 'draft',
      id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating encounter:', error);
    return NextResponse.json({ error: 'Failed to update encounter' }, { status: 500 });
  }
}

// PATCH - Sign encounter
export async function PATCH(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Encounter ID is required' }, { status: 400 });
    }

    if (action === 'sign') {
      const result = await query(`
        UPDATE encounters SET
          status = 'signed',
          signed_at = NOW(),
          signed_by = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [user.userId, id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error signing encounter:', error);
    return NextResponse.json({ error: 'Failed to sign encounter' }, { status: 500 });
  }
}

// DELETE - Delete encounter
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
      'DELETE FROM encounters WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting encounter:', error);
    return NextResponse.json({ error: 'Failed to delete encounter' }, { status: 500 });
  }
}
