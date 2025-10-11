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

// GET - Fetch vital signs for a patient
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('encounterId');
    const limit = searchParams.get('limit') || '20';

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    let queryStr = `
      SELECT vs.*,
             u.first_name as recorded_by_first_name,
             u.last_name as recorded_by_last_name
      FROM vital_signs vs
      LEFT JOIN users u ON vs.recorded_by = u.id
      WHERE vs.patient_id = $1
    `;
    const params: unknown[] = [parseInt(patientId)];

    if (encounterId) {
      queryStr += ` AND vs.encounter_id = $${params.length + 1}`;
      params.push(parseInt(encounterId));
    }

    queryStr += ` ORDER BY vs.recorded_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    return NextResponse.json({ error: 'Failed to fetch vital signs' }, { status: 500 });
  }
}

// POST - Create new vital signs entry
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
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      respiratoryRate,
      temperature,
      temperatureUnit = 'C',
      oxygenSaturation,
      weight,
      weightUnit = 'kg',
      height,
      heightUnit = 'cm',
      painScale,
      notes
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (weight && height) {
      // Convert to metric if needed
      const weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
      const heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
      bmi = (weightKg / (heightM * heightM)).toFixed(1);
    }

    const result = await query(`
      INSERT INTO vital_signs (
        patient_id, encounter_id, recorded_by, recorded_at,
        blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, respiratory_rate, temperature, temperature_unit,
        oxygen_saturation, weight, weight_unit, height, height_unit,
        bmi, pain_scale, notes
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      patientId, encounterId || null, user.userId,
      bloodPressureSystolic || null, bloodPressureDiastolic || null,
      heartRate || null, respiratoryRate || null,
      temperature || null, temperatureUnit,
      oxygenSaturation || null,
      weight || null, weightUnit,
      height || null, heightUnit,
      bmi, painScale || null, notes || null
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating vital signs:', error);
    return NextResponse.json({ error: 'Failed to create vital signs' }, { status: 500 });
  }
}

// PUT - Update vital signs entry
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      respiratoryRate,
      temperature,
      temperatureUnit,
      oxygenSaturation,
      weight,
      weightUnit,
      height,
      heightUnit,
      painScale,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (weight && height) {
      const weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
      const heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
      bmi = (weightKg / (heightM * heightM)).toFixed(1);
    }

    const result = await query(`
      UPDATE vital_signs SET
        blood_pressure_systolic = $1,
        blood_pressure_diastolic = $2,
        heart_rate = $3,
        respiratory_rate = $4,
        temperature = $5,
        temperature_unit = $6,
        oxygen_saturation = $7,
        weight = $8,
        weight_unit = $9,
        height = $10,
        height_unit = $11,
        bmi = $12,
        pain_scale = $13,
        notes = $14
      WHERE id = $15
      RETURNING *
    `, [
      bloodPressureSystolic || null, bloodPressureDiastolic || null,
      heartRate || null, respiratoryRate || null,
      temperature || null, temperatureUnit || 'C',
      oxygenSaturation || null,
      weight || null, weightUnit || 'kg',
      height || null, heightUnit || 'cm',
      bmi, painScale || null, notes || null,
      id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vital signs entry not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vital signs:', error);
    return NextResponse.json({ error: 'Failed to update vital signs' }, { status: 500 });
  }
}

// DELETE - Delete vital signs entry
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
      'DELETE FROM vital_signs WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vital signs entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vital signs:', error);
    return NextResponse.json({ error: 'Failed to delete vital signs' }, { status: 500 });
  }
}
