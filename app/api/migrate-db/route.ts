import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const maxDuration = 60;

export async function GET() {
  try {
    console.log('Starting database migration...');

    // Add new columns to patients table
    const columns = [
      'address TEXT',
      'city VARCHAR(100)',
      'state VARCHAR(100)',
      'postal_code VARCHAR(20)',
      'country VARCHAR(100)',
      'emergency_contact_name VARCHAR(200)',
      'emergency_contact_phone VARCHAR(20)',
      'emergency_contact_relationship VARCHAR(50)',
      'blood_type VARCHAR(10)',
      'allergies TEXT',
      'chronic_conditions TEXT',
      'current_medications TEXT',
      'insurance_provider VARCHAR(200)',
      'insurance_policy_number VARCHAR(100)',
      'occupation VARCHAR(100)',
      'marital_status VARCHAR(20)',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];

    for (const column of columns) {
      const columnName = column.split(' ')[0];
      const columnDef = column.substring(columnName.length + 1);
      try {
        await sql.query(
          `ALTER TABLE patients ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef}`
        );
        console.log(`Added column: ${columnName}`);
      } catch (error) {
        console.log(`Column ${columnName} might already exist or error:`, error);
      }
    }

    console.log('Migration complete');

    return NextResponse.json({
      success: true,
      message: 'Database migration complete!'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
