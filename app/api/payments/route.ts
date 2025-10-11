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

// Generate payment number
async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) as count FROM payments WHERE EXTRACT(YEAR FROM payment_date) = $1`,
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `PAY-${year}-${count.toString().padStart(5, '0')}`;
}

// GET - Fetch payments
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const invoiceId = searchParams.get('invoiceId');

    let queryStr = `
      SELECT p.*,
             pat.first_name as patient_first_name,
             pat.last_name as patient_last_name,
             i.invoice_number,
             u.first_name as processed_by_first_name,
             u.last_name as processed_by_last_name
      FROM payments p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN users u ON p.processed_by = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (patientId) {
      queryStr += ` AND p.patient_id = $${params.length + 1}`;
      params.push(parseInt(patientId));
    }

    if (invoiceId) {
      queryStr += ` AND p.invoice_id = $${params.length + 1}`;
      params.push(parseInt(invoiceId));
    }

    queryStr += ` ORDER BY p.payment_date DESC, p.created_at DESC`;

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Record new payment
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoiceId,
      patientId,
      amount,
      paymentMethod,
      paymentDate,
      referenceNumber,
      notes
    } = body;

    if (!invoiceId || !patientId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Invoice ID, patient ID, amount, and payment method are required' },
        { status: 400 }
      );
    }

    const paymentNumber = await generatePaymentNumber();

    // Record payment
    const paymentResult = await query(
      `INSERT INTO payments (
        payment_number, invoice_id, patient_id, payment_date,
        amount, payment_method, reference_number, notes, processed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        paymentNumber,
        invoiceId,
        patientId,
        paymentDate || new Date().toISOString().split('T')[0],
        amount,
        paymentMethod,
        referenceNumber || null,
        notes || null,
        user.userId
      ]
    );

    // Update invoice
    await query(
      `UPDATE invoices SET
        amount_paid = amount_paid + $1,
        balance = total_amount - (amount_paid + $1),
        status = CASE
          WHEN (total_amount - (amount_paid + $1)) <= 0 THEN 'paid'
          WHEN (amount_paid + $1) > 0 THEN 'partial'
          ELSE status
        END,
        payment_method = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [amount, paymentMethod, invoiceId]
    );

    return NextResponse.json(paymentResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
