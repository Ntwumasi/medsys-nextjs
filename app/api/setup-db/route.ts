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

    // Create CPT codes table (procedure codes)
    console.log('Creating cpt_codes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS cpt_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        base_price DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('CPT codes table created');

    // Create ICD-10 codes table (diagnosis codes)
    console.log('Creating icd10_codes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS icd10_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('ICD-10 codes table created');

    // Create invoices table
    console.log('Creating invoices table...');
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        balance DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Invoices table created');

    // Create invoice_items table (line items)
    console.log('Creating invoice_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        cpt_code_id INTEGER REFERENCES cpt_codes(id),
        description TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Invoice items table created');

    // Create payments table
    console.log('Creating payments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        reference_number VARCHAR(100),
        notes TEXT,
        processed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Payments table created');

    // Create insurance_claims table
    console.log('Creating insurance_claims table...');
    await sql`
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id SERIAL PRIMARY KEY,
        claim_number VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        insurance_company VARCHAR(200) NOT NULL,
        policy_number VARCHAR(100) NOT NULL,
        group_number VARCHAR(100),
        subscriber_name VARCHAR(200),
        subscriber_relationship VARCHAR(50),
        claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
        service_date DATE NOT NULL,
        diagnosis_codes TEXT[],
        procedure_codes TEXT[],
        total_charged DECIMAL(10,2) NOT NULL,
        amount_approved DECIMAL(10,2),
        amount_paid DECIMAL(10,2),
        patient_responsibility DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'submitted',
        submission_date DATE,
        response_date DATE,
        denial_reason TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Insurance claims table created');

    // Create lab_test_catalog table
    console.log('Creating lab_test_catalog table...');
    await sql`
      CREATE TABLE IF NOT EXISTS lab_test_catalog (
        id SERIAL PRIMARY KEY,
        test_code VARCHAR(20) UNIQUE NOT NULL,
        test_name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        specimen_type VARCHAR(100),
        normal_range_min DECIMAL(10,2),
        normal_range_max DECIMAL(10,2),
        unit VARCHAR(50),
        turnaround_time VARCHAR(50),
        cpt_code_id INTEGER REFERENCES cpt_codes(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Lab test catalog table created');

    // Create lab_orders table
    console.log('Creating lab_orders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS lab_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        ordering_provider_id INTEGER REFERENCES users(id),
        test_id INTEGER REFERENCES lab_test_catalog(id),
        priority VARCHAR(20) DEFAULT 'routine',
        clinical_indication TEXT,
        special_instructions TEXT,
        status VARCHAR(50) DEFAULT 'ordered',
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        collected_at TIMESTAMP,
        received_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Lab orders table created');

    // Create lab_results table
    console.log('Creating lab_results table...');
    await sql`
      CREATE TABLE IF NOT EXISTS lab_results (
        id SERIAL PRIMARY KEY,
        lab_order_id INTEGER REFERENCES lab_orders(id) ON DELETE CASCADE,
        test_id INTEGER REFERENCES lab_test_catalog(id),
        result_value VARCHAR(200),
        result_numeric DECIMAL(10,2),
        unit VARCHAR(50),
        reference_range VARCHAR(100),
        is_abnormal BOOLEAN DEFAULT false,
        abnormal_flag VARCHAR(20),
        result_status VARCHAR(50) DEFAULT 'final',
        result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        performed_by VARCHAR(200),
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Lab results table created');

    // Create imaging_study_catalog table
    console.log('Creating imaging_study_catalog table...');
    await sql`
      CREATE TABLE IF NOT EXISTS imaging_study_catalog (
        id SERIAL PRIMARY KEY,
        study_code VARCHAR(20) UNIQUE NOT NULL,
        study_name VARCHAR(200) NOT NULL,
        modality VARCHAR(50),
        body_part VARCHAR(100),
        category VARCHAR(100),
        contrast_required BOOLEAN DEFAULT false,
        preparation_instructions TEXT,
        typical_duration VARCHAR(50),
        cpt_code_id INTEGER REFERENCES cpt_codes(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Imaging study catalog table created');

    // Create imaging_orders table
    console.log('Creating imaging_orders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS imaging_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        encounter_id INTEGER REFERENCES encounters(id) ON DELETE SET NULL,
        ordering_provider_id INTEGER REFERENCES users(id),
        study_id INTEGER REFERENCES imaging_study_catalog(id),
        priority VARCHAR(20) DEFAULT 'routine',
        clinical_indication TEXT NOT NULL,
        clinical_history TEXT,
        special_instructions TEXT,
        contrast_used BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'ordered',
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_at TIMESTAMP,
        performed_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Imaging orders table created');

    // Create imaging_results table
    console.log('Creating imaging_results table...');
    await sql`
      CREATE TABLE IF NOT EXISTS imaging_results (
        id SERIAL PRIMARY KEY,
        imaging_order_id INTEGER REFERENCES imaging_orders(id) ON DELETE CASCADE,
        study_id INTEGER REFERENCES imaging_study_catalog(id),
        findings TEXT,
        impression TEXT,
        recommendations TEXT,
        radiologist_name VARCHAR(200),
        result_status VARCHAR(50) DEFAULT 'preliminary',
        result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        images_url TEXT,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        critical_result BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Imaging results table created');

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

    // Insert sample CPT codes
    console.log('Inserting sample CPT codes...');
    await sql`
      INSERT INTO cpt_codes (code, description, category, base_price)
      VALUES
        ('99213', 'Office Visit - Established Patient, Level 3', 'Evaluation & Management', 150.00),
        ('99214', 'Office Visit - Established Patient, Level 4', 'Evaluation & Management', 200.00),
        ('99203', 'Office Visit - New Patient, Level 3', 'Evaluation & Management', 175.00),
        ('99204', 'Office Visit - New Patient, Level 4', 'Evaluation & Management', 250.00),
        ('80053', 'Comprehensive Metabolic Panel', 'Laboratory', 45.00),
        ('85025', 'Complete Blood Count (CBC)', 'Laboratory', 35.00),
        ('93000', 'Electrocardiogram (EKG)', 'Diagnostic', 75.00),
        ('71046', 'Chest X-Ray', 'Radiology', 120.00),
        ('90471', 'Immunization Administration', 'Preventive', 25.00),
        ('90834', 'Psychotherapy - 45 minutes', 'Mental Health', 180.00)
      ON CONFLICT (code) DO NOTHING
    `;
    console.log('Sample CPT codes inserted');

    // Insert sample ICD-10 codes
    console.log('Inserting sample ICD-10 codes...');
    await sql`
      INSERT INTO icd10_codes (code, description, category)
      VALUES
        ('I10', 'Essential (primary) hypertension', 'Cardiovascular'),
        ('E11.9', 'Type 2 diabetes mellitus without complications', 'Endocrine'),
        ('J06.9', 'Acute upper respiratory infection, unspecified', 'Respiratory'),
        ('M79.3', 'Panniculitis, unspecified', 'Musculoskeletal'),
        ('K21.9', 'Gastro-esophageal reflux disease without esophagitis', 'Digestive'),
        ('F41.1', 'Generalized anxiety disorder', 'Mental Health'),
        ('R51', 'Headache', 'Symptoms'),
        ('Z00.00', 'Encounter for general adult medical examination without abnormal findings', 'Preventive'),
        ('E78.5', 'Hyperlipidemia, unspecified', 'Endocrine'),
        ('M25.50', 'Pain in unspecified joint', 'Musculoskeletal')
      ON CONFLICT (code) DO NOTHING
    `;
    console.log('Sample ICD-10 codes inserted');

    // Insert sample lab tests
    console.log('Inserting sample lab tests...');
    await sql`
      INSERT INTO lab_test_catalog (test_code, test_name, category, specimen_type, normal_range_min, normal_range_max, unit, turnaround_time)
      VALUES
        ('CBC', 'Complete Blood Count', 'Hematology', 'Whole Blood', NULL, NULL, 'cells/mcL', '2-4 hours'),
        ('CMP', 'Comprehensive Metabolic Panel', 'Chemistry', 'Serum', NULL, NULL, 'mg/dL', '4-6 hours'),
        ('LIPID', 'Lipid Panel', 'Chemistry', 'Serum', NULL, NULL, 'mg/dL', '4-6 hours'),
        ('TSH', 'Thyroid Stimulating Hormone', 'Endocrinology', 'Serum', 0.4, 4.0, 'mIU/L', '24 hours'),
        ('HbA1c', 'Hemoglobin A1C', 'Chemistry', 'Whole Blood', 4.0, 5.6, '%', '2-4 hours'),
        ('URINE', 'Urinalysis', 'Urinalysis', 'Urine', NULL, NULL, NULL, '1-2 hours'),
        ('PT-INR', 'Prothrombin Time/INR', 'Coagulation', 'Plasma', 0.8, 1.2, 'ratio', '2-4 hours'),
        ('BMP', 'Basic Metabolic Panel', 'Chemistry', 'Serum', NULL, NULL, 'mEq/L', '4-6 hours'),
        ('LFT', 'Liver Function Tests', 'Chemistry', 'Serum', NULL, NULL, 'U/L', '4-6 hours'),
        ('PSA', 'Prostate-Specific Antigen', 'Tumor Markers', 'Serum', 0, 4.0, 'ng/mL', '24 hours')
      ON CONFLICT (test_code) DO NOTHING
    `;
    console.log('Sample lab tests inserted');

    // Insert sample imaging studies
    console.log('Inserting sample imaging studies...');
    await sql`
      INSERT INTO imaging_study_catalog (study_code, study_name, modality, body_part, category, contrast_required, typical_duration)
      VALUES
        ('XR-CHEST', 'Chest X-Ray', 'X-Ray', 'Chest', 'Radiology', false, '15 min'),
        ('CT-HEAD', 'CT Head without Contrast', 'CT', 'Head', 'Radiology', false, '30 min'),
        ('CT-ABD', 'CT Abdomen/Pelvis with Contrast', 'CT', 'Abdomen/Pelvis', 'Radiology', true, '45 min'),
        ('MRI-BRAIN', 'MRI Brain with and without Contrast', 'MRI', 'Brain', 'Radiology', true, '60 min'),
        ('US-ABD', 'Abdominal Ultrasound', 'Ultrasound', 'Abdomen', 'Radiology', false, '30 min'),
        ('ECHO', 'Echocardiogram', 'Ultrasound', 'Heart', 'Cardiology', false, '45 min'),
        ('MAMMO', 'Screening Mammogram', 'Mammography', 'Breast', 'Radiology', false, '30 min'),
        ('XR-SPINE', 'Spine X-Ray', 'X-Ray', 'Spine', 'Radiology', false, '20 min'),
        ('MRI-SPINE', 'MRI Lumbar Spine', 'MRI', 'Spine', 'Radiology', false, '45 min'),
        ('DEXA', 'DEXA Bone Density Scan', 'DEXA', 'Skeletal', 'Radiology', false, '20 min')
      ON CONFLICT (study_code) DO NOTHING
    `;
    console.log('Sample imaging studies inserted');

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
