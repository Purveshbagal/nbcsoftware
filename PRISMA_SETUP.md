# Prisma Integration Setup - NBC Pedia Software

## ✅ Setup Complete!

Prisma ORM successfully integrated with MongoDB database. Your project now supports **auto table/collection creation** on VPS MongoDB when you deploy!

---

## 📁 Files Created

1. **prisma/schema.prisma** - Complete schema with all 30+ models
2. **src/lib/prisma.ts** - Prisma client singleton instance
3. **prisma.config.ts** - Prisma configuration

---

## 🔧 Available NPM Scripts

```bash
# Generate Prisma Client (run after schema changes)
npm run prisma:generate

# Push schema to database (creates/updates collections automatically)
npm run prisma:push

# Open Prisma Studio (GUI for database)
npm run prisma:studio

# Format schema file
npm run prisma:format
```

---

## 🚀 How to Use Prisma

### 1. **Import Prisma Client**
```typescript
import prisma from '@/lib/prisma'
```

### 2. **Basic CRUD Operations**

#### Create
```typescript
// Create a new doctor
const doctor = await prisma.doctor.create({
  data: {
    name: 'Dr. Sharma',
    contactNo: '9876543210',
    speciality: 'Cardiology',
    city: 'Mumbai',
    isActive: true,
  },
})
```

#### Read
```typescript
// Find all doctors
const doctors = await prisma.doctor.findMany({
  where: {
    isActive: true,
    city: 'Mumbai',
  },
  orderBy: {
    name: 'asc',
  },
})

// Find one doctor by ID
const doctor = await prisma.doctor.findUnique({
  where: { id: doctorId },
})

// Find with filters
const activeDoctors = await prisma.doctor.findMany({
  where: {
    AND: [
      { isActive: true },
      { speciality: 'Cardiology' },
    ],
  },
})
```

#### Update
```typescript
// Update a doctor
const updated = await prisma.doctor.update({
  where: { id: doctorId },
  data: {
    contactNo: '9999999999',
    city: 'Delhi',
  },
})

// Update many
await prisma.doctor.updateMany({
  where: { city: 'Mumbai' },
  data: { zone: 'West' },
})
```

#### Delete
```typescript
// Delete one
await prisma.doctor.delete({
  where: { id: doctorId },
})

// Delete many
await prisma.doctor.deleteMany({
  where: { isActive: false },
})
```

### 3. **Advanced Queries**

#### Aggregation
```typescript
// Count doctors by city
const count = await prisma.doctor.count({
  where: { city: 'Mumbai' },
})

// Group by and aggregate
const stats = await prisma.doctor.groupBy({
  by: ['city'],
  _count: {
    id: true,
  },
})
```

#### Relations
```typescript
// Create employee with attendance
const employee = await prisma.employee.create({
  data: {
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    attendances: {
      create: [
        {
          date: '2024-10-25',
          workAgenda: 'Visit 5 doctors',
          status: 'present',
        },
      ],
    },
  },
  include: {
    attendances: true,
  },
})
```

#### Transactions
```typescript
// Multiple operations in one transaction
const result = await prisma.$transaction(async (tx) => {
  const doctor = await tx.doctor.create({
    data: { name: 'Dr. Patel', contactNo: '9876543210' },
  })

  const visit = await tx.visit.create({
    data: {
      visitType: 'doctor',
      doctor: doctor.name,
      visitDate: '2024-10-25',
      status: 'planned',
    },
  })

  return { doctor, visit }
})
```

### 4. **Example API Route**

```typescript
// app/api/doctors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ doctors })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const doctor = await prisma.doctor.create({
      data: {
        name: body.name,
        contactNo: body.contactNo,
        email: body.email,
        speciality: body.speciality,
        city: body.city,
        isActive: true,
      },
    })

    return NextResponse.json({ doctor }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    )
  }
}
```

---

## 🌐 VPS Deployment - Auto Table Creation

जेव्हा तुम्ही VPS वर deploy कराल, Prisma automatic tables/collections create करेल:

### Steps:

1. **VPS वर MongoDB URI set करा** (.env file मध्ये):
```bash
MONGODB_URI=mongodb://username:password@vps-ip:27017/nbc-pedia
```

2. **Schema push करा**:
```bash
npm run prisma:push
```

यामुळे सर्व 30+ collections automatic create होतील तुमच्या VPS MongoDB मध्ये!

### Automatic Collections Created:
- users
- employees
- doctors
- firms
- products
- visits
- orders
- expenses
- attendances
- locationpings
- leaves
- samplerequests
- targets
- payments
- settings
- administrators
- registrations
- entitlements
- farecharts
- holidays
- masteritems
- mediaassets
- monthmaintenances
- reminders
- sfaproducts
- supporttickets
- doctorqualifications
- doctorspecialities
- presentations
- counters

---

## 🔄 Migration from Mongoose to Prisma

तुम्ही दोन्ही Mongoose आणि Prisma एकत्र वापरू शकता:

### Gradual Migration Strategy:

1. **New features** - Prisma वापरा
2. **Existing features** - Mongoose सोबत राहू द्या
3. **Slowly migrate** - एक एक route Prisma मध्ये convert करा

### Example: Using Both

```typescript
// Old code (Mongoose)
import Doctor from '@/models/Doctor'
const doctors = await Doctor.find({ isActive: true })

// New code (Prisma)
import prisma from '@/lib/prisma'
const doctors = await prisma.doctor.findMany({
  where: { isActive: true }
})
```

---

## 📊 Prisma Studio

Database GUI access करण्यासाठी:

```bash
npm run prisma:studio
```

ह्यामुळे browser मध्ये http://localhost:5555 open होईल जिथे तुम्ही:
- सर्व data visualize करू शकता
- Records create/update/delete करू शकता
- Relations explore करू शकता

---

## ⚡ Performance Tips

1. **Use indexes** - Schema मध्ये @@index define केले आहेत
2. **Select specific fields**:
```typescript
const doctors = await prisma.doctor.findMany({
  select: {
    id: true,
    name: true,
    contactNo: true,
  },
})
```

3. **Use pagination**:
```typescript
const doctors = await prisma.doctor.findMany({
  skip: page * pageSize,
  take: pageSize,
})
```

4. **Connection pooling** - Already configured in [src/lib/prisma.ts](src/lib/prisma.ts)

---

## 🐛 Troubleshooting

### Error: "PrismaClient is not configured"
```bash
npm run prisma:generate
```

### Error: "Cannot connect to database"
Check your MONGODB_URI in .env file

### Schema changes not reflecting
```bash
npm run prisma:generate
npm run prisma:push
```

---

## 📚 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [MongoDB Connector](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

---

## ✨ Benefits

✅ **Type Safety** - Full TypeScript support
✅ **Auto Completion** - IntelliSense in VS Code
✅ **Auto Schema Sync** - `prisma db push` creates collections automatically
✅ **No Manual Migrations** - Schema changes = `prisma push`
✅ **Better Performance** - Optimized queries
✅ **GUI Interface** - Prisma Studio
✅ **Easy Relations** - Simple joins and nested queries

---

Happy Coding! 🚀
