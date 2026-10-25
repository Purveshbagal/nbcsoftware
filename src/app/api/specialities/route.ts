import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const specialities = await prisma.doctorSpeciality.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: specialities,
    });
  } catch (error) {
    console.error('Error fetching specialities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch specialities' },
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

    const speciality = await prisma.doctorSpeciality.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: speciality,
    });
  } catch (error) {
    console.error('Error creating speciality:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create speciality' },
      { status: 500 }
    );
  }
}
