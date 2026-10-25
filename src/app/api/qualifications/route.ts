import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const qualifications = await prisma.doctorQualification.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: qualifications,
    });
  } catch (error) {
    console.error('Error fetching qualifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch qualifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const qualification = await prisma.doctorQualification.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: qualification,
    });
  } catch (error) {
    console.error('Error creating qualification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create qualification' },
      { status: 500 }
    );
  }
}
