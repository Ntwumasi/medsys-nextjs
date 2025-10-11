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

    // Create appointments table
    console.log('Creating appointments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        appointment_date TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        appointment_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        reason TEXT,
        notes TEXT,
        reminder_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Appointments table created');

    // Create vital_signs table
    console.log('Creating vital_signs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS vital_signs (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER,
        recorded_by INTEGER REFERENCES users(id),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blood_pressure_systolic INTEGER,
        blood_pressure_diastolic INTEGER,
        heart_rate INTEGER,
        respiratory_rate INTEGER,
        temperature DECIMAL(4,1),
        temperature_unit VARCHAR(1) DEFAULT 'C',
        oxygen_saturation INTEGER,
        weight DECIMAL(5,2),
        weight_unit VARCHAR(2) DEFAULT 'kg',
        height DECIMAL(5,2),
        height_unit VARCHAR(2) DEFAULT 'cm',
        bmi DECIMAL(4,1),
        pain_scale INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Vital signs table created');

    // Create encounters table (clinical visits/notes)
    console.log('Creating encounters table...');
    await sql`
      CREATE TABLE IF NOT EXISTS encounters (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        provider_id INTEGER REFERENCES users(id),
        encounter_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        encounter_type VARCHAR(100),
        chief_complaint TEXT,
        history_present_illness TEXT,
        review_of_systems TEXT,
        physical_examination TEXT,
        assessment TEXT,
        plan TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        signed_at TIMESTAMP,
        signed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Encounters table created');

    // Create allergies table
    console.log('Creating allergies table...');
    await sql`
      CREATE TABLE IF NOT EXISTS allergies (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        allergen VARCHAR(200) NOT NULL,
        allergen_type VARCHAR(50),
        reaction TEXT,
        severity VARCHAR(50),
        onset_date DATE,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Allergies table created');

    // Create medications table (current medications)
    console.log('Creating medications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        medication_name VARCHAR(200) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        route VARCHAR(50),
        start_date DATE,
        end_date DATE,
        indication TEXT,
        prescriber VARCHAR(200),
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Medications table created');

    // Create prescriptions table
    console.log('Creating prescriptions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        prescriber_id INTEGER REFERENCES users(id),
        prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        medication_name VARCHAR(200) NOT NULL,
        generic_name VARCHAR(200),
        dosage VARCHAR(100) NOT NULL,
        form VARCHAR(50),
        route VARCHAR(50),
        frequency VARCHAR(100) NOT NULL,
        duration VARCHAR(100),
        quantity VARCHAR(50),
        refills INTEGER DEFAULT 0,
        indication TEXT,
        instructions TEXT,
        status VARCHAR(20) DEFAULT 'active',
        dispense_as_written BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Prescriptions table created');

    // Create medical_history table
    console.log('Creating medical_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS medical_history (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        history_type VARCHAR(50) NOT NULL,
        condition_name VARCHAR(200),
        diagnosis_date DATE,
        status VARCHAR(20),
        notes TEXT,
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Medical history table created');

    // Create immunizations table
    console.log('Creating immunizations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS immunizations (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        vaccine_name VARCHAR(200) NOT NULL,
        vaccination_date DATE NOT NULL,
        dose_number INTEGER,
        route VARCHAR(50),
        site VARCHAR(100),
        lot_number VARCHAR(100),
        manufacturer VARCHAR(200),
        expiration_date DATE,
        administered_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Immunizations table created');

    // Create diagnoses/problem_list table
    console.log('Creating diagnoses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        diagnosis_code VARCHAR(20),
        diagnosis_name VARCHAR(300) NOT NULL,
        diagnosis_type VARCHAR(50),
        onset_date DATE,
        resolution_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        severity VARCHAR(20),
        notes TEXT,
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Diagnoses table created');

    // Create orders table (lab/imaging)
    console.log('Creating orders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        ordering_provider_id INTEGER REFERENCES users(id),
        order_type VARCHAR(50) NOT NULL,
        order_name VARCHAR(200) NOT NULL,
        order_code VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'routine',
        clinical_indication TEXT,
        instructions TEXT,
        status VARCHAR(50) DEFAULT 'ordered',
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_date TIMESTAMP,
        completed_date TIMESTAMP,
        results TEXT,
        results_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Orders table created');

    // Add foreign key to vital_signs for encounter_id
    console.log('Adding foreign key constraints...');
    await sql`
      ALTER TABLE vital_signs
      DROP CONSTRAINT IF EXISTS vital_signs_encounter_id_fkey
    `;
    await sql`
      ALTER TABLE vital_signs
      ADD CONSTRAINT vital_signs_encounter_id_fkey
      FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL
    `;
    console.log('Foreign key constraints added');

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
