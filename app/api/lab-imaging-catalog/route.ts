import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET);
  } catch {
    return null;
  }
}

// GET - Fetch lab tests and imaging studies catalog
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'lab' or 'imaging'
    const search = searchParams.get('search');

    if (type === 'lab') {
      let queryStr = 'SELECT * FROM lab_test_catalog WHERE is_active = true';
      const params: unknown[] = [];

      if (search) {
        queryStr += ` AND (test_name ILIKE $1 OR test_code ILIKE $1)`;
        params.push(`%${search}%`);
      }

      queryStr += ` ORDER BY test_name LIMIT 50`;
      const result = await query(queryStr, params);
      return NextResponse.json(result.rows);
    }

    if (type === 'imaging') {
      let queryStr = 'SELECT * FROM imaging_study_catalog WHERE is_active = true';
      const params: unknown[] = [];

      if (search) {
        queryStr += ` AND (study_name ILIKE $1 OR study_code ILIKE $1)`;
        params.push(`%${search}%`);
      }

      queryStr += ` ORDER BY study_name LIMIT 50`;
      const result = await query(queryStr, params);
      return NextResponse.json(result.rows);
    }

    return NextResponse.json({ error: 'Type must be lab or imaging' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
  }
}
