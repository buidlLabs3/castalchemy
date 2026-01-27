// Temporary test to verify route structure works
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ test: 'route works' });
}


