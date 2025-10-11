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

async function generateOrderNumber(type: string): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) as count FROM lab_orders WHERE EXTRACT(YEAR FROM ordered_at) = $1`,
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `LAB-${year}-${count.toString().padStart(5, '0')}`;
}

// GET - Fetch lab orders
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let queryStr = `
      SELECT lo.*,
             lt.test_name, lt.test_code, lt.specimen_type,
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             u.first_name as provider_first_name, u.last_name as provider_last_name
      FROM lab_orders lo
      LEFT JOIN lab_test_catalog lt ON lo.test_id = lt.id
      LEFT JOIN patients p ON lo.patient_id = p.id
      LEFT JOIN users u ON lo.ordering_provider_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (patientId) {
      queryStr += ` AND lo.patient_id = $${params.length + 1}`;
      params.push(parseInt(patientId));
    }

    if (status) {
      queryStr += ` AND lo.status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY lo.ordered_at DESC`;

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    return NextResponse.json({ error: 'Failed to fetch lab orders' }, { status: 500 });
  }
}

// POST - Create lab order
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
      testId,
      priority = 'routine',
      clinicalIndication,
      specialInstructions
    } = body;

    if (!patientId || !testId) {
      return NextResponse.json(
        { error: 'Patient ID and test ID are required' },
        { status: 400 }
      );
    }

    const orderNumber = await generateOrderNumber('lab');

    const result = await query(
      `INSERT INTO lab_orders (
        order_number, patient_id, encounter_id, ordering_provider_id,
        test_id, priority, clinical_indication, special_instructions, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        orderNumber,
        patientId,
        encounterId || null,
        user.userId,
        testId,
        priority,
        clinicalIndication || null,
        specialInstructions || null,
        'ordered'
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating lab order:', error);
    return NextResponse.json({ error: 'Failed to create lab order' }, { status: 500 });
  }
}

// PUT - Update lab order status
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, collectedAt, receivedAt, completedAt, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE lab_orders SET
        status = COALESCE($1, status),
        collected_at = COALESCE($2, collected_at),
        received_at = COALESCE($3, received_at),
        completed_at = COALESCE($4, completed_at),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [status || null, collectedAt || null, receivedAt || null, completedAt || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lab order:', error);
    return NextResponse.json({ error: 'Failed to update lab order' }, { status: 500 });
  }
}
