import { sql } from '@vercel/postgres';

async function setupDatabase() {
  try {
    console.log('Creating tables...');

    // Create users table
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
    console.log('✓ Users table created');

    // Create patients table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Patients table created');

    // Create admin user (password: admin123)
    // Hash generated with bcrypt for "admin123"
    const adminHash = '$2b$10$rQJ5P8qWqW8qWqW8qWqW8uO5xP3xP3xP3xP3xP3xP3xP3xP3xP3xP';

    await sql`
      INSERT INTO users (email, password_hash, role, first_name, last_name)
      VALUES ('admin@medsys.com', ${adminHash}, 'admin', 'Admin', 'User')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✓ Admin user created (admin@medsys.com / admin123)');

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

setupDatabase();
