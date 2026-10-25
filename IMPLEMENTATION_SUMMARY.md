# Implementation Summary

## Completed Tasks

### 1. App Renaming ✅
- **Web Apps**:
  - NBC Pedia → **Survey NBC**
  - NBC Labs → **Racer NBC**
  - Updated in [src/lib/workspaces.ts](src/lib/workspaces.ts:290)

- **Mobile Apps**:
  - Survey app title updated to "Survey NBC" in [mobile/lib/main.dart](mobile/lib/main.dart:19)
  - Racer app title updated to "Racer NBC" in [mobile-labs/lib/main.dart](mobile-labs/lib/main.dart:25)
  - Updated descriptions in pubspec.yaml files

### 2. Database Schema Updates ✅

#### Doctor Model ([src/models/Doctor.ts](src/models/Doctor.ts))
Added new fields:
- `uinId` - Unique identification number (MH001, MH002, etc.)
- `hospitalAddress` - Hospital address
- `location` - {latitude, longitude} for Racer app
- `bankDetails` - {bankName, accountNumber, ifscCode, branchName}
- `documents` - Array of document uploads
- `category` - Enum: "Important", "Super Important", "A"
- `approvalStatus` - Enum: "pending", "approved", "rejected"
- `approvedBy` - Admin who approved
- `approvedAt` - Approval timestamp
- `source` - "web", "racer", or "survey"

#### User Model ([src/models/User.ts](src/models/User.ts))
Added budget tracking:
- `budgetLimit.totalLimit` - Total budget assigned by admin
- `budgetLimit.spentAmount` - Amount spent/approved
- `budgetLimit.availableAmount` - Remaining budget

#### New Models
- **DoctorQualification** ([src/models/DoctorQualification.ts](src/models/DoctorQualification.ts))
  - Stores doctor qualifications (MBBS, MD, MS, etc.)
  - Admins can add/delete qualifications

- **DoctorSpeciality** ([src/models/DoctorSpeciality.ts](src/models/DoctorSpeciality.ts))
  - Stores medical specialities
  - Admins can add/delete specialities

### 3. API Endpoints Created ✅

#### Web Admin APIs

**Qualifications Management**:
- `GET /api/doctor-qualifications` - Get all qualifications
- `POST /api/doctor-qualifications` - Create qualification (admin only)
- `DELETE /api/doctor-qualifications?id=xxx` - Delete qualification (admin only)

**Specialities Management**:
- `GET /api/doctor-specialities` - Get all specialities
- `POST /api/doctor-specialities` - Create speciality (admin only)
- `DELETE /api/doctor-specialities?id=xxx` - Delete speciality (admin only)

**Doctor Approval**:
- `GET /api/sfa/doctors/approve?status=pending` - Get pending doctors
- `POST /api/sfa/doctors/approve` - Approve/reject doctor
  ```json
  { "doctorId": "xxx", "action": "approve" | "reject" }
  ```

**Budget Management**:
- `GET /api/budget` - Get budget for current user
- `PUT /api/budget` - Update user budget limit (admin only)
  ```json
  { "username": "user1", "totalLimit": 50000 }
  ```

**Survey Doctors**:
- `GET /api/survey-doctors?q=search` - Get approved doctors for Survey app
- `GET /api/survey-doctors?uin=MH001` - Search by UIN ID

#### Mobile APIs

**For Both Apps**:
- `GET /api/labs/doctor-qualifications` - Get qualification list
- `GET /api/labs/doctor-specialities` - Get speciality list

**Doctor Management** ([src/app/api/labs/doctors/route.ts](src/app/api/labs/doctors/route.ts)):
- `GET /api/labs/doctors?q=search` - Search doctors (including by UIN ID)
- `POST /api/labs/doctors` - Add new doctor
  - Racer app (`source: "racer"`): Auto-generates UIN, sets status to "pending"
  - Survey app: Regular doctor creation

### 4. UIN ID Generation ✅
- Format: **MH001**, MH002, MH003, etc.
- Auto-increments from last UIN
- Implemented in [src/app/api/labs/doctors/route.ts:59-72](src/app/api/labs/doctors/route.ts:59-72)

### 5. Seed Script ✅
Created script to populate initial data:
```bash
npm run seed:doctor-masters
```

This seeds:
- **30+ Doctor Qualifications**: MBBS, MD, MS, DNB, DM, MCh, BAMS, BHMS, BDS, etc.
- **40+ Medical Specialities**: Cardiology, Neurology, Pediatrics, Orthopedics, etc.

---

## Pending Tasks (Mobile App Implementation)

### Survey Mobile App (mobile/)

#### 1. Update New Register Form
**File**: [mobile/lib/screens/new_register_form_screen.dart](mobile/lib/screens/new_register_form_screen.dart)

Add these fields:
- Doctor Name (existing)
- Mobile Number (existing)
- **Qualification** - Dropdown (fetch from `/api/labs/doctor-qualifications`)
- **Speciality** - Dropdown (fetch from `/api/labs/doctor-specialities`)
- **Category** - Dropdown: "Important", "Super Important", "A"
- **Gender** - Radio buttons: Male, Female, Other
- Hospital Name (existing)
- **Hospital Address** - Text field
- **Email** - Email field
- **Bank Details**:
  - Bank Name
  - Account Number
  - IFSC Code
  - Branch Name
- **Upload Doctor Document** - File picker (PDF/images)

#### 2. Add Separate "Add Doctor" Section
Create new screen or tab:
- List all doctors added to the system
- "New" button to add doctor (opens form from #1)
- After saving, doctor appears in this list
- Users can select doctor from this list and click "Send Request"

#### 3. Dashboard with Budget Display
Update [mobile/lib/screens/dashboard_screen.dart](mobile/lib/screens/dashboard_screen.dart):

Add three cards showing:
- **Available Budget**: ₹XX,XXX (green)
- **Spent Budget**: ₹XX,XXX (orange)
- **Total Limit**: ₹XX,XXX (blue)

Fetch from: `GET /api/budget`

### Racer Mobile App (mobile-labs/)

#### 4. Update Add Doctor Form
**File**: Create new screen or update directory

Form fields:
- Doctor Name
- Mobile Number
- **Qualification** - Dropdown (fetch from `/api/labs/doctor-qualifications`)
- **Speciality** - Dropdown (fetch from `/api/labs/doctor-specialities`)
- **Category** - Dropdown: "Important", "Super Important", "A"
- **Gender** - Radio buttons: Male, Female, Other
- Hospital Name
- **Hospital Address**
- **Email**
- **Bank Details** (4 fields)
- **Upload Doctor Document** - File picker
- **Location Picker**:
  - Button "Set Location"
  - Opens map screen
  - Shows "Use Current Location" button
  - Mark location on map
  - Save lat/lng

When saving:
```dart
await apiClient.post('/api/labs/doctors', {
  'source': 'racer',
  'name': name,
  'contactNo': mobile,
  'qualification': qualification,
  'speciality': speciality,
  'category': category,
  'gender': gender,
  'hospitalName': hospitalName,
  'hospitalAddress': hospitalAddress,
  'email': email,
  'bankDetails': {
    'bankName': bankName,
    'accountNumber': accountNumber,
    'ifscCode': ifscCode,
    'branchName': branchName,
  },
  'location': {
    'latitude': lat,
    'longitude': lng,
  },
  'documents': [base64EncodedDocs],
});
```

### Web Admin Interface

#### 5. Doctor Approval Interface
Create page: `/sfa/doctors/approvals`

Features:
- Table showing pending doctors from Racer app
- Columns: UIN ID, Name, Hospital, Added By, Date
- Action buttons: "Approve" | "Reject"
- View doctor details (all fields)

API calls:
```typescript
// Get pending
const res = await fetch('/api/sfa/doctors/approve?status=pending');

// Approve
await fetch('/api/sfa/doctors/approve', {
  method: 'POST',
  body: JSON.stringify({ doctorId: id, action: 'approve' })
});
```

#### 6. Budget Limit Management
Update user creation/editing forms:

Add fields:
- **Budget Limit** (number input)
- Show current: Available / Spent / Total

On save:
```typescript
await fetch('/api/budget', {
  method: 'PUT',
  body: JSON.stringify({ username: user.username, totalLimit: amount })
});
```

Also add to admin dashboard:
- Graph showing budget utilization per user
- Filters: Last Month, This Month, This Year, Custom Date
- Use candle/bar chart showing spent amounts

---

## Workflow

### Racer App → Admin → Survey App Flow

1. **Racer App User** adds a doctor with all details
   - System generates UIN ID (e.g., MH001)
   - Status set to "pending"
   - Doctor saved to database

2. **Admin** reviews pending doctor
   - Opens approval interface
   - Views all doctor details
   - Clicks "Approve" or "Reject"

3. **If Approved**:
   - Status changes to "approved"
   - Doctor becomes visible in Survey mobile app's doctor list
   - Survey users can now select this doctor for payment requests

4. **Survey App User**:
   - Opens "Add Doctor" section
   - Sees list of all approved doctors
   - Can search by UIN ID (MH001)
   - Selects doctor and sends payment request

---

## Budget Workflow

1. **Admin** creates user with budget limit (e.g., ₹50,000)
2. **User** sees on dashboard:
   - Total Limit: ₹50,000
   - Spent: ₹0
   - Available: ₹50,000

3. **User** submits payment request for ₹20,000
4. **Admin** approves payment
   - System updates user budget:
     - Spent: ₹20,000
     - Available: ₹30,000

5. **User** can only submit requests up to available amount
6. **Admin** can increase total limit anytime

---

## Database Migrations Needed

Run these commands after deployment:

```bash
# Seed qualifications and specialities
npm run seed:doctor-masters
```

No migration needed for existing doctors - new fields will be empty/default values.

---

## Testing Checklist

- [ ] Run seed script
- [ ] Test qualification/speciality CRUD from admin panel
- [ ] Add doctor from Racer app (verify UIN generation)
- [ ] Approve doctor from admin panel
- [ ] Verify approved doctor appears in Survey app
- [ ] Test budget limit assignment
- [ ] Test budget tracking on payment approval
- [ ] Search doctor by UIN ID
- [ ] Upload documents in doctor form
- [ ] Test location picker in Racer app

---

## Next Steps

1. Implement mobile app screens (Survey & Racer)
2. Create admin web interfaces for approval and budget management
3. Run seed script to populate master data
4. Test end-to-end workflow
5. Deploy and train users

---

## Notes

- All bank details are stored encrypted in the database
- Documents can be stored as base64 strings or file URLs
- Location is optional but recommended for Racer app
- Category dropdown is limited to exactly 3 values: "Important", "Super Important", "A"
- UIN ID search is case-insensitive
- Admin can edit budget limits at any time
- Spent amount auto-updates when payments are approved
