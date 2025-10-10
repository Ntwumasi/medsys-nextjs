import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

    // Get search query
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Fetch patients
    const result = await sql`
      SELECT
        id,
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        created_at
      FROM patients
      WHERE
        LOWER(first_name) LIKE ${`%${search.toLowerCase()}%`}
        OR LOWER(last_name) LIKE ${`%${search.toLowerCase()}%`}
        OR patient_number LIKE ${`%${search}%`}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch patients error:', error);
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

    // Only allow doctors, nurses, and admins to create patients
    if (!['doctor', 'nurse', 'admin', 'receptionist'].includes(payload.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      city,
      state,
      postalCode,
      country,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      bloodType,
      allergies,
      chronicConditions,
      currentMedications,
      insuranceProvider,
      insurancePolicyNumber,
      occupation,
      maritalStatus
    } = await request.json();

    if (!firstName || !lastName || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: 'First name, last name, date of birth, and gender are required' },
        { status: 400 }
      );
    }

    // Generate patient number (simple implementation)
    const patientNumber = `P${Date.now()}`;

    // Insert patient
    const result = await sql`
      INSERT INTO patients (
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        city,
        state,
        postal_code,
        country,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        blood_type,
        allergies,
        chronic_conditions,
        current_medications,
        insurance_provider,
        insurance_policy_number,
        occupation,
        marital_status
      )
      VALUES (
        ${patientNumber},
        ${firstName},
        ${lastName},
        ${dateOfBirth},
        ${gender},
        ${phone || null},
        ${email || null},
        ${address || null},
        ${city || null},
        ${state || null},
        ${postalCode || null},
        ${country || null},
        ${emergencyContactName || null},
        ${emergencyContactPhone || null},
        ${emergencyContactRelationship || null},
        ${bloodType || null},
        ${allergies || null},
        ${chronicConditions || null},
        ${currentMedications || null},
        ${insuranceProvider || null},
        ${insurancePolicyNumber || null},
        ${occupation || null},
        ${maritalStatus || null}
      )
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
