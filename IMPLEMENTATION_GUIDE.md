# Survey Mobile App - Complete Implementation Guide

## Overview
This document provides a complete guide to implementing the new features for the Survey Mobile App as per the requirements.

---

## Features Implemented

### 1. Enhanced Doctor Registration Form ✅

**Requirements:**
- Doctor Name
- Mobile Number
- Qualification (dropdown with comprehensive list)
- Speciality (dropdown with comprehensive medical specialties)
- Category (dropdown: Important, Super Important, A)
- Gender
- Hospital Name
- Hospital Address
- Email
- Bank Details
- Upload Doctor Document

**Backend Changes:**

#### Database Schema Updates
- Updated `prisma/schema.prisma`:
  - Modified `Registration` model with all new required fields
  - Added `DoctorDocument` type for file uploads
  - Added `BankDetails` type for bank information

#### API Endpoints Created
1. **GET /api/qualifications** - Fetch all medical qualifications
2. **POST /api/qualifications** - Add new qualification (admin only)
3. **GET /api/specialities** - Fetch all medical specialities
4. **POST /api/specialities** - Add new speciality (admin only)

#### Seed Data
- Created `prisma/seed-qualifications-specialities.ts` with:
  - 60+ medical qualifications (MBBS, MD, MS, DNB, DM, MCh, etc.)
  - 80+ medical specialities (Cardiology, Neurology, etc.)

**To Seed Data:**
```bash
npx tsx prisma/seed-qualifications-specialities.ts
```

---

### 2. User Budget Management ✅

**Requirements:**
- Admin can set budget limit when creating user
- Admin can edit user budget limit later
- User can only send payment requests within their budget limit
- System validates requests against available budget

**Backend Changes:**

#### Database Schema
- Updated `User` model in Mongoose (`src/models/User.ts`):
  ```typescript
  budgetLimit: {
    totalLimit: Number,      // Admin sets this
    spentAmount: Number,     // Auto-updated on approval
    availableAmount: Number, // Calculated
    updatedAt: Date,         // Tracking
    updatedBy: String        // Tracking
  }
  ```

#### API Endpoints Updated
1. **POST /api/users** - Create user with budget limit
   - Already supports `budgetLimit` parameter

2. **PATCH /api/users/[id]** - Update user budget limit
   - Added support for updating `budgetLimit`
   - Preserves spent amount when updating limit

3. **POST /api/payments** - Create payment request
   - Validates against user's available budget
   - Checks pending + spent + new request <= total limit
   - Returns detailed error message if limit exceeded

4. **PATCH /api/payments/[id]** - Approve/reject payment
   - Auto-updates user's spent budget on approval
   - Updates `spentAmount` and `availableAmount`

**Frontend Changes Needed:**
- Update user creation form to include budget limit field
- Update user edit form to allow budget limit modification
- Show budget validation errors on payment request form

---

### 3. Dashboard with Budget Metrics ✅

**Requirements:**
- User dashboard shows:
  - Available Budget
  - Spent Budget
  - Total Limit
- Admin dashboard shows:
  - Graph (candlestick) of user spending
  - Filters: last month, this month, this year, custom date
  - Per-user breakdown

**Backend Changes:**

#### API Endpoint Created
**GET /api/analytics/budget** - Budget analytics endpoint
- Parameters:
  - `period`: "last_month" | "this_month" | "this_year" | "custom"
  - `startDate`: For custom period
  - `endDate`: For custom period
  - `username`: Filter by specific user (admin only)

- Response for Admin:
  ```json
  {
    "period": "this_month",
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "users": [
      {
        "username": "user1",
        "name": "User Name",
        "totalLimit": 100000,
        "spentAmount": 45000,
        "availableAmount": 55000,
        "periodSpending": 25000,
        "payments": [...]
      }
    ]
  }
  ```

- Response for Field User:
  ```json
  {
    "period": "this_month",
    "username": "user1",
    "totalLimit": 100000,
    "spentAmount": 45000,
    "availableAmount": 55000,
    "periodSpending": 25000,
    "payments": [...]
  }
  ```

**Frontend Changes Needed:**

#### For Field User Dashboard
Create `src/app/(app)/dashboard/page.tsx`:
```tsx
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [budgetData, setBudgetData] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/budget?period=this_month')
      .then(res => res.json())
      .then(setBudgetData);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>Total Limit</CardHeader>
        <CardContent>₹{budgetData?.totalLimit}</CardContent>
      </Card>
      <Card>
        <CardHeader>Spent Budget</CardHeader>
        <CardContent>₹{budgetData?.spentAmount}</CardContent>
      </Card>
      <Card>
        <CardHeader>Available Budget</CardHeader>
        <CardContent>₹{budgetData?.availableAmount}</CardContent>
      </Card>
    </div>
  );
}
```

#### For Admin Analytics Dashboard
Create `src/app/(app)/analytics/budget/page.tsx`:
- Add period selector (Last Month, This Month, This Year, Custom)
- Use chart library (recharts or chart.js) for candlestick graph
- Show user-wise spending breakdown
- Display table with detailed payments

**Recommended Chart Library:**
```bash
npm install recharts
```

Example chart usage:
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

<BarChart data={users}>
  <XAxis dataKey="username" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="periodSpending" fill="#8884d8" />
  <Bar dataKey="availableAmount" fill="#82ca9d" />
</BarChart>
```

---

### 4. Add Doctor Section ✅

**Requirements:**
- Separate section to add doctors
- List view of added doctors
- Add new doctor form
- Select doctor from this list in registration

**Backend Changes:**

#### API Endpoints Created
1. **GET /api/doctors** - List all doctors
   - Query params: `status` (filter by approval), `search` (name/mobile/hospital)
   - Returns all doctors with approval status

2. **POST /api/doctors** - Add new doctor
   - Same fields as registration form
   - Creates doctor with `pending` approval status

3. **GET /api/doctors/[id]** - Get single doctor details

4. **PATCH /api/doctors/[id]** - Update doctor
   - Update doctor details
   - Approve/reject doctor (admin only)

5. **DELETE /api/doctors/[id]** - Delete doctor (admin only)

**Frontend Changes Needed:**

#### Create Doctor Management Page
`src/app/(app)/doctors/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const res = await fetch('/api/doctors');
    const data = await res.json();
    setDoctors(data.data);
  };

  const columns = [
    { accessorKey: 'name', header: 'Doctor Name' },
    { accessorKey: 'contactNo', header: 'Mobile' },
    { accessorKey: 'qualification', header: 'Qualification' },
    { accessorKey: 'speciality', header: 'Speciality' },
    { accessorKey: 'hospitalName', header: 'Hospital' },
    { accessorKey: 'approvalStatus', header: 'Status' },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button onClick={() => handleApprove(row.original.id)}>
          Approve
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add New Doctor
        </Button>
      </div>

      <DataTable columns={columns} data={doctors} />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
          </DialogHeader>
          <DoctorForm onSuccess={loadDoctors} onClose={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

#### Create Doctor Form Component
`src/components/DoctorForm.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DoctorForm({ onSuccess, onClose }) {
  const [qualifications, setQualifications] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    qualification: '',
    speciality: '',
    category: '',
    gender: '',
    hospitalName: '',
    hospitalAddress: '',
    email: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
    },
  });

  useEffect(() => {
    // Load qualifications and specialities
    Promise.all([
      fetch('/api/qualifications').then(r => r.json()),
      fetch('/api/specialities').then(r => r.json()),
    ]).then(([quals, specs]) => {
      setQualifications(quals.data);
      setSpecialities(specs.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      onSuccess();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Doctor Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        placeholder="Mobile Number"
        value={formData.mobileNumber}
        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
        required
      />

      <Select
        value={formData.qualification}
        onValueChange={(value) => setFormData({ ...formData, qualification: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Qualification" />
        </SelectTrigger>
        <SelectContent>
          {qualifications.map((q) => (
            <SelectItem key={q.id} value={q.name}>
              {q.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={formData.speciality}
        onValueChange={(value) => setFormData({ ...formData, speciality: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Speciality" />
        </SelectTrigger>
        <SelectContent>
          {specialities.map((s) => (
            <SelectItem key={s.id} value={s.name}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={formData.category}
        onValueChange={(value) => setFormData({ ...formData, category: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Important">Important</SelectItem>
          <SelectItem value="Super Important">Super Important</SelectItem>
          <SelectItem value="A">A</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={formData.gender}
        onValueChange={(value) => setFormData({ ...formData, gender: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Male">Male</SelectItem>
          <SelectItem value="Female">Female</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Hospital Name"
        value={formData.hospitalName}
        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
        required
      />

      <Input
        placeholder="Hospital Address"
        value={formData.hospitalAddress}
        onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
        required
      />

      <Input
        type="email"
        placeholder="Email (Optional)"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      <h3 className="font-semibold">Bank Details</h3>

      <Input
        placeholder="Bank Name"
        value={formData.bankDetails.bankName}
        onChange={(e) => setFormData({
          ...formData,
          bankDetails: { ...formData.bankDetails, bankName: e.target.value }
        })}
      />

      <Input
        placeholder="Account Number"
        value={formData.bankDetails.accountNumber}
        onChange={(e) => setFormData({
          ...formData,
          bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
        })}
      />

      <Input
        placeholder="IFSC Code"
        value={formData.bankDetails.ifscCode}
        onChange={(e) => setFormData({
          ...formData,
          bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
        })}
      />

      <Input
        placeholder="Branch Name"
        value={formData.bankDetails.branchName}
        onChange={(e) => setFormData({
          ...formData,
          bankDetails: { ...formData.bankDetails, branchName: e.target.value }
        })}
      />

      <div className="flex gap-2">
        <Button type="submit">Save Doctor</Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

---

## Mobile App Changes (Flutter)

### 1. Update New Register Screen

**Location:** `mobile/lib/screens/new_register_screen.dart`

**Changes Required:**

1. Add dropdown fields for:
   - Qualification (fetch from `/api/qualifications`)
   - Speciality (fetch from `/api/specialities`)
   - Category (Important, Super Important, A)
   - Gender (Male, Female, Other)

2. Add bank details fields:
   - Bank Name
   - Account Number
   - IFSC Code
   - Branch Name

3. Add document upload button

4. Update API call to use new registration format

**Example Code:**

```dart
class NewRegisterScreen extends StatefulWidget {
  @override
  _NewRegisterScreenState createState() => _NewRegisterScreenState();
}

class _NewRegisterScreenState extends State<NewRegisterScreen> {
  List<Qualification> qualifications = [];
  List<Speciality> specialities = [];

  String? selectedQualification;
  String? selectedSpeciality;
  String? selectedCategory;
  String? selectedGender;

  final TextEditingController doctorNameController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController hospitalNameController = TextEditingController();
  final TextEditingController hospitalAddressController = TextEditingController();
  final TextEditingController emailController = TextEditingController();

  final TextEditingController bankNameController = TextEditingController();
  final TextEditingController accountNumberController = TextEditingController();
  final TextEditingController ifscController = TextEditingController();
  final TextEditingController branchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadDropdownData();
  }

  Future<void> loadDropdownData() async {
    final qualsResponse = await apiClient.get('/api/qualifications');
    final specsResponse = await apiClient.get('/api/specialities');

    setState(() {
      qualifications = (qualsResponse['data'] as List)
          .map((q) => Qualification.fromJson(q))
          .toList();
      specialities = (specsResponse['data'] as List)
          .map((s) => Speciality.fromJson(s))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('New Registration')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: doctorNameController,
              decoration: InputDecoration(labelText: 'Doctor Name *'),
            ),
            SizedBox(height: 16),

            TextField(
              controller: mobileController,
              decoration: InputDecoration(labelText: 'Mobile Number *'),
              keyboardType: TextInputType.phone,
            ),
            SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: selectedQualification,
              decoration: InputDecoration(labelText: 'Qualification *'),
              items: qualifications.map((q) {
                return DropdownMenuItem(
                  value: q.name,
                  child: Text(q.name),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  selectedQualification = value;
                });
              },
            ),
            SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: selectedSpeciality,
              decoration: InputDecoration(labelText: 'Speciality *'),
              items: specialities.map((s) {
                return DropdownMenuItem(
                  value: s.name,
                  child: Text(s.name),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  selectedSpeciality = value;
                });
              },
            ),
            SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: selectedCategory,
              decoration: InputDecoration(labelText: 'Category *'),
              items: ['Important', 'Super Important', 'A'].map((cat) {
                return DropdownMenuItem(
                  value: cat,
                  child: Text(cat),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  selectedCategory = value;
                });
              },
            ),
            SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: selectedGender,
              decoration: InputDecoration(labelText: 'Gender *'),
              items: ['Male', 'Female', 'Other'].map((gender) {
                return DropdownMenuItem(
                  value: gender,
                  child: Text(gender),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  selectedGender = value;
                });
              },
            ),
            SizedBox(height: 16),

            TextField(
              controller: hospitalNameController,
              decoration: InputDecoration(labelText: 'Hospital Name *'),
            ),
            SizedBox(height: 16),

            TextField(
              controller: hospitalAddressController,
              decoration: InputDecoration(labelText: 'Hospital Address *'),
              maxLines: 2,
            ),
            SizedBox(height: 16),

            TextField(
              controller: emailController,
              decoration: InputDecoration(labelText: 'Email (Optional)'),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 24),

            Text('Bank Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),

            TextField(
              controller: bankNameController,
              decoration: InputDecoration(labelText: 'Bank Name'),
            ),
            SizedBox(height: 16),

            TextField(
              controller: accountNumberController,
              decoration: InputDecoration(labelText: 'Account Number'),
            ),
            SizedBox(height: 16),

            TextField(
              controller: ifscController,
              decoration: InputDecoration(labelText: 'IFSC Code'),
            ),
            SizedBox(height: 16),

            TextField(
              controller: branchController,
              decoration: InputDecoration(labelText: 'Branch Name'),
            ),
            SizedBox(height: 24),

            ElevatedButton(
              onPressed: submitRegistration,
              child: Text('Submit Registration'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> submitRegistration() async {
    // Validation
    if (doctorNameController.text.isEmpty ||
        mobileController.text.isEmpty ||
        selectedQualification == null ||
        selectedSpeciality == null ||
        selectedCategory == null ||
        selectedGender == null ||
        hospitalNameController.text.isEmpty ||
        hospitalAddressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    final data = {
      'doctorName': doctorNameController.text,
      'mobileNumber': mobileController.text,
      'qualification': selectedQualification,
      'speciality': selectedSpeciality,
      'category': selectedCategory,
      'gender': selectedGender,
      'hospitalName': hospitalNameController.text,
      'hospitalAddress': hospitalAddressController.text,
      'email': emailController.text.isEmpty ? null : emailController.text,
      'bankDetails': {
        'bankName': bankNameController.text,
        'accountNumber': accountNumberController.text,
        'ifscCode': ifscController.text,
        'branchName': branchController.text,
      },
    };

    try {
      final response = await apiClient.post('/api/registrations', data);

      if (response['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration submitted successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
}
```

### 2. Add Doctor Selection in Registration

Create a new screen to show approved doctors and allow selection:

```dart
class SelectDoctorScreen extends StatefulWidget {
  @override
  _SelectDoctorScreenState createState() => _SelectDoctorScreenState();
}

class _SelectDoctorScreenState extends State<SelectDoctorScreen> {
  List<Doctor> doctors = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadDoctors();
  }

  Future<void> loadDoctors() async {
    try {
      final response = await apiClient.get('/api/doctors?status=approved');
      setState(() {
        doctors = (response['data'] as List)
            .map((d) => Doctor.fromJson(d))
            .toList();
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Select Doctor')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Select Doctor'),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => NewDoctorScreen()),
              ).then((_) => loadDoctors());
            },
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: doctors.length,
        itemBuilder: (context, index) {
          final doctor = doctors[index];
          return ListTile(
            title: Text(doctor.name),
            subtitle: Text('${doctor.speciality} - ${doctor.hospitalName}'),
            trailing: Text(doctor.contactNo),
            onTap: () {
              Navigator.pop(context, doctor);
            },
          );
        },
      ),
    );
  }
}
```

### 3. Update Dashboard to Show Budget

```dart
class DashboardTab extends StatefulWidget {
  @override
  _DashboardTabState createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  Map<String, dynamic>? budgetData;

  @override
  void initState() {
    super.initState();
    loadBudgetData();
  }

  Future<void> loadBudgetData() async {
    final response = await apiClient.get('/api/analytics/budget?period=this_month');
    setState(() {
      budgetData = response;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (budgetData == null) {
      return Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text('Total Limit', style: TextStyle(fontSize: 14, color: Colors.grey)),
                        SizedBox(height: 8),
                        Text(
                          '₹${budgetData!['totalLimit']}',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text('Spent', style: TextStyle(fontSize: 14, color: Colors.grey)),
                        SizedBox(height: 8),
                        Text(
                          '₹${budgetData!['spentAmount']}',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.red),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text('Available', style: TextStyle(fontSize: 14, color: Colors.grey)),
                        SizedBox(height: 8),
                        Text(
                          '₹${budgetData!['availableAmount']}',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## Next Steps

### 1. Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed qualifications and specialities
npx tsx prisma/seed-qualifications-specialities.ts
```

### 2. Web UI Development
- [ ] Create doctors management page (`/doctors`)
- [ ] Update user creation/edit forms to include budget limits
- [ ] Create budget analytics dashboard page (`/analytics/budget`)
- [ ] Add user dashboard with budget cards

### 3. Mobile App Development
- [ ] Update registration form with new fields
- [ ] Add dropdown data loading for qualifications/specialities
- [ ] Create doctor selection screen
- [ ] Update dashboard to show budget metrics
- [ ] Add budget validation error handling

### 4. Testing
- [ ] Test user budget limit creation and editing
- [ ] Test payment request validation against budget
- [ ] Test budget update on payment approval
- [ ] Test doctor management workflow
- [ ] Test analytics API with different date ranges
- [ ] Test mobile app registration flow

### 5. Deployment
- [ ] Update environment variables if needed
- [ ] Deploy backend changes
- [ ] Build and deploy mobile app updates
- [ ] Run database migrations on production

---

## API Reference Summary

### Qualifications & Specialities
- `GET /api/qualifications` - List all qualifications
- `POST /api/qualifications` - Add qualification (admin)
- `GET /api/specialities` - List all specialities
- `POST /api/specialities` - Add speciality (admin)

### Doctors
- `GET /api/doctors` - List doctors (with filters)
- `POST /api/doctors` - Create doctor
- `GET /api/doctors/[id]` - Get doctor details
- `PATCH /api/doctors/[id]` - Update/approve doctor
- `DELETE /api/doctors/[id]` - Delete doctor (admin)

### Users (Budget)
- `POST /api/users` - Create user with budget limit
- `PATCH /api/users/[id]` - Update user budget limit

### Payments (Budget Validation)
- `POST /api/payments` - Create payment (validates budget)
- `PATCH /api/payments/[id]` - Approve payment (updates budget)

### Analytics
- `GET /api/analytics/budget` - Get budget analytics
  - Query: `period`, `startDate`, `endDate`, `username`

---

## Important Notes

1. **Budget Tracking:**
   - Budget is updated ONLY when payment is approved (not when created)
   - Pending payments are considered when validating new requests
   - Rejecting a payment does NOT affect the budget

2. **Doctor vs Registration:**
   - The `/api/doctors` endpoint creates doctors in the `doctors` collection
   - The `/api/registrations` endpoint creates registration requests
   - Both serve different purposes in the workflow

3. **Validation:**
   - All required fields are validated on the backend
   - Budget limits are enforced for field users only
   - Admin users bypass budget checks

4. **Security:**
   - All endpoints require authentication
   - Admin-only actions are protected with role checks
   - Budget modifications require admin role

---

## Support & Questions

For any questions or issues during implementation:
1. Check the API endpoint responses for detailed error messages
2. Review the Prisma schema for data structure
3. Check the browser console / mobile logs for frontend errors
4. Verify environment variables and database connections

Good luck with the implementation! 🚀
