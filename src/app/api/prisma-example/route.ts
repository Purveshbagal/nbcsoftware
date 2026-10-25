import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Example API route showing Prisma usage
 *
 * GET /api/prisma-example - Test Prisma connection and fetch stats
 */
export async function GET(request: NextRequest) {
  try {
    // Test connection by counting records
    const [
      usersCount,
      doctorsCount,
      employeesCount,
      visitsCount,
      ordersCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.employee.count(),
      prisma.visit.count(),
      prisma.order.count(),
    ])

    // Fetch some sample data
    const recentDoctors = await prisma.doctor.findMany({
      where: { isActive: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        speciality: true,
        city: true,
        contactNo: true,
      },
    })

    const recentVisits = await prisma.visit.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        visitType: true,
        doctor: true,
        firm: true,
        visitDate: true,
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Prisma connection successful!',
      stats: {
        users: usersCount,
        doctors: doctorsCount,
        employees: employeesCount,
        visits: visitsCount,
        orders: ordersCount,
      },
      samples: {
        recentDoctors,
        recentVisits,
      },
    })
  } catch (error) {
    console.error('Prisma error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to database',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Example POST endpoint
 *
 * POST /api/prisma-example - Create a test doctor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const doctor = await prisma.doctor.create({
      data: {
        name: body.name || 'Test Doctor',
        contactNo: body.contactNo || '9999999999',
        email: body.email,
        speciality: body.speciality || 'General Medicine',
        city: body.city || 'Mumbai',
        state: body.state || 'Maharashtra',
        isActive: true,
        source: 'web',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Doctor created successfully',
      doctor,
    }, { status: 201 })
  } catch (error) {
    console.error('Prisma error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create doctor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
