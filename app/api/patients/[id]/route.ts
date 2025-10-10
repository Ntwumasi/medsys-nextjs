import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch patient
    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only allow doctors, nurses, and admins to update patients
    if (!['doctor', 'nurse', 'admin', 'receptionist'].includes(payload.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;

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

    // Update patient
    const result = await sql`
      UPDATE patients
      SET
        first_name = ${firstName},
        last_name = ${lastName},
        date_of_birth = ${dateOfBirth},
        gender = ${gender},
        phone = ${phone || null},
        email = ${email || null},
        address = ${address || null},
        city = ${city || null},
        state = ${state || null},
        postal_code = ${postalCode || null},
        country = ${country || null},
        emergency_contact_name = ${emergencyContactName || null},
        emergency_contact_phone = ${emergencyContactPhone || null},
        emergency_contact_relationship = ${emergencyContactRelationship || null},
        blood_type = ${bloodType || null},
        allergies = ${allergies || null},
        chronic_conditions = ${chronicConditions || null},
        current_medications = ${currentMedications || null},
        insurance_provider = ${insuranceProvider || null},
        insurance_policy_number = ${insurancePolicyNumber || null},
        occupation = ${occupation || null},
        marital_status = ${maritalStatus || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
