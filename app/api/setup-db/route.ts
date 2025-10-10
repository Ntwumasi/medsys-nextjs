import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const maxDuration = 60; // Set max duration to 60 seconds

export async function GET() {
  try {
    console.log('Starting database setup...');
    console.log('Connection string:', process.env.POSTGRES_PRISMA_URL ? 'Using POSTGRES_PRISMA_URL (pooled)' : 'Using POSTGRES_URL (direct)');

    // Create users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Users table created');

    // Create patients table
    console.log('Creating patients table...');
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        patient_number VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(50),
        blood_type VARCHAR(10),
        allergies TEXT,
        chronic_conditions TEXT,
        current_medications TEXT,
        insurance_provider VARCHAR(200),
        insurance_policy_number VARCHAR(100),
        occupation VARCHAR(100),
        marital_status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Patients table created');

    // Create admin user (password: admin123)
    const adminHash = '$2b$10$ANeTso1QCCLlsBt6V23bDe.1F1oKtqhEgCzkbE4grPDPlTgahaMfa';

    console.log('Creating admin user...');
    await sql`
      INSERT INTO users (email, password_hash, role, first_name, last_name)
      VALUES ('admin@medsys.com', ${adminHash}, 'admin', 'Admin', 'User')
      ON CONFLICT (email) DO UPDATE SET password_hash = ${adminHash}
    `;
    console.log('Admin user created');

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! Admin user: admin@medsys.com / admin123'
    });
  } catch (error) {
    console.error('Database setup error:', error);
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
