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

// GET - Search CPT and ICD-10 codes
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'cpt' or 'icd10'
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    if (!type || (type !== 'cpt' && type !== 'icd10')) {
      return NextResponse.json(
        { error: 'Type parameter required (cpt or icd10)' },
        { status: 400 }
      );
    }

    let queryStr: string;
    const params: unknown[] = [];

    if (type === 'cpt') {
      queryStr = `
        SELECT * FROM cpt_codes
        WHERE is_active = true
      `;

      if (search) {
        queryStr += ` AND (code ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      if (category) {
        queryStr += ` AND category = $${params.length + 1}`;
        params.push(category);
      }

      queryStr += ` ORDER BY code LIMIT 50`;
    } else {
      queryStr = `
        SELECT * FROM icd10_codes
        WHERE is_active = true
      `;

      if (search) {
        queryStr += ` AND (code ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      if (category) {
        queryStr += ` AND category = $${params.length + 1}`;
        params.push(category);
      }

      queryStr += ` ORDER BY code LIMIT 50`;
    }

    const result = await query(queryStr, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching billing codes:', error);
    return NextResponse.json({ error: 'Failed to fetch billing codes' }, { status: 500 });
  }
}
