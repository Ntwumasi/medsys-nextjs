import { NextRequest, NextResponse } from 'next/server';
import { sql, query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    // Build query dynamically
    let sqlQuery = `
      SELECT
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.patient_number,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (startDate) {
      sqlQuery += ` AND a.appointment_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sqlQuery += ` AND a.appointment_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (patientId) {
      sqlQuery += ` AND a.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    if (status) {
      sqlQuery += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sqlQuery += ' ORDER BY a.appointment_date ASC';

    const result = await query(sqlQuery, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const {
      patientId,
      doctorId,
      appointmentDate,
      durationMinutes,
      appointmentType,
      reason,
      notes
    } = await request.json();

    if (!patientId || !appointmentDate) {
      return NextResponse.json(
        { error: 'Patient ID and appointment date are required' },
        { status: 400 }
      );
    }

    // Insert appointment
    const result = await sql`
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        appointment_date,
        duration_minutes,
        appointment_type,
        reason,
        notes,
        status
      )
      VALUES (
        ${patientId},
        ${doctorId || null},
        ${appointmentDate},
        ${durationMinutes || 30},
        ${appointmentType || null},
        ${reason || null},
        ${notes || null},
        'scheduled'
      )
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
