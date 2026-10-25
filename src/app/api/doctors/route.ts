import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    // Filter by approval status if provided
    if (status) {
      where.approvalStatus = status;
    }

    // Search by name, mobile, or hospital
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactNo: { contains: search } },
        { hospitalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      mobileNumber,
      qualification,
      speciality,
      category,
      gender,
      hospitalName,
      hospitalAddress,
      email,
      bankDetails,
      documents,
    } = body;

    // Validation
    if (!name || !mobileNumber || !qualification || !speciality || !category || !gender || !hospitalName || !hospitalAddress) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        name,
        contactNo: mobileNumber,
        qualification,
        speciality,
        category,
        gender,
        hospitalName,
        hospitalAddress,
        email,
        bankDetails: bankDetails ? {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          branchName: bankDetails.branchName,
        } : undefined,
        documents: documents || [],
        approvalStatus: 'pending',
        source: 'mobile_app',
        createdBy: {
          username: session.username,
          name: session.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}
