import { NextResponse } from 'next/server';
import { getEducationLesson, getEducationLessons } from '@/lib/education/lessons';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get('step');

  if (step) {
    return NextResponse.json({
      lesson: getEducationLesson(step),
      timestamp: Date.now(),
      source: 'provisional-preview',
    });
  }

  return NextResponse.json({
    lessons: getEducationLessons(),
    timestamp: Date.now(),
    source: 'provisional-preview',
  });
}
