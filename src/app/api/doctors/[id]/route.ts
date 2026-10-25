import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { approvalStatus, ...updateData } = body;

    // If approving/rejecting, only admins can do that
    if (approvalStatus && session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can approve/reject doctors' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        ...updateData,
        ...(approvalStatus && {
          approvalStatus,
          approvedBy: {
            username: session.username,
            name: session.name,
          },
          approvedAt: new Date(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.doctor.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}
