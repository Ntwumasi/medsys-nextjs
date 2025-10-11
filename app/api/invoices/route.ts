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

// Generate invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) as count FROM invoices WHERE EXTRACT(YEAR FROM invoice_date) = $1`,
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `INV-${year}-${count.toString().padStart(5, '0')}`;
}

// GET - Fetch invoices
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');

    let queryStr = `
      SELECT i.*,
             p.first_name as patient_first_name,
             p.last_name as patient_last_name,
             p.patient_number,
             u.first_name as created_by_first_name,
             u.last_name as created_by_last_name,
             e.encounter_type
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN encounters e ON i.encounter_id = e.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (invoiceId) {
      queryStr += ` AND i.id = $${params.length + 1}`;
      params.push(parseInt(invoiceId));
    }

    if (patientId) {
      queryStr += ` AND i.patient_id = $${params.length + 1}`;
      params.push(parseInt(patientId));
    }

    if (status) {
      queryStr += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY i.invoice_date DESC, i.created_at DESC`;

    const result = await query(queryStr, params);

    // If specific invoice requested, fetch items too
    if (invoiceId && result.rows.length > 0) {
      const itemsResult = await query(
        `SELECT ii.*, c.code as cpt_code, c.description as cpt_description
         FROM invoice_items ii
         LEFT JOIN cpt_codes c ON ii.cpt_code_id = c.id
         WHERE ii.invoice_id = $1
         ORDER BY ii.id`,
        [parseInt(invoiceId)]
      );
      return NextResponse.json({
        ...result.rows[0],
        items: itemsResult.rows
      });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST - Create new invoice
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
      items,
      dueDate,
      taxRate = 0,
      discountAmount = 0,
      notes
    } = body;

    if (!patientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Patient ID and items are required' },
        { status: 400 }
      );
    }

    const invoiceNumber = await generateInvoiceNumber();

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + (item.quantity * item.unitPrice), 0
    );
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount - (discountAmount || 0);

    // Create invoice
    const invoiceResult = await query(
      `INSERT INTO invoices (
        invoice_number, patient_id, encounter_id, due_date,
        subtotal, tax_amount, discount_amount, total_amount, balance,
        status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        invoiceNumber,
        patientId,
        encounterId || null,
        dueDate || null,
        subtotal,
        taxAmount,
        discountAmount || 0,
        totalAmount,
        totalAmount, // Initial balance equals total
        'pending',
        notes || null,
        user.userId
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Create invoice items
    for (const item of items) {
      await query(
        `INSERT INTO invoice_items (
          invoice_id, cpt_code_id, description, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoice.id,
          item.cptCodeId || null,
          item.description,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice
        ]
      );
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

// PUT - Update invoice
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, paymentMethod, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE invoices SET
        status = COALESCE($1, status),
        payment_method = COALESCE($2, payment_method),
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
      [status || null, paymentMethod || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
