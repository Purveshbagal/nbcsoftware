# HR Portal - Complete Implementation Guide

## 🎯 Overview
Complete rebuild of HR Portal with 6 main features:
1. Employee Salary Management
2. Attendance Tracking (with 2-hour minimum)
3. Pending Salary Calculation
4. Salary Payment
5. Advanced Payment (with installments)
6. Leave Requests (with 12-day paid leave limit)

---

## ✅ Already Created

### Database Models (in `src/models/`):
- ✅ `EmployeeSalary.ts` - Monthly salary per employee
- ✅ `EmployeeAttendance.ts` - Daily attendance with status
- ✅ `SalaryPayment.ts` - Payment history with deductions
- ✅ `AdvancedPayment.ts` - Advances with installment tracking
- ✅ `LeaveRequest.ts` - Leave applications
- ✅ `PaidLeaveBalance.ts` - Yearly 12-day limit tracker

### Completed Features:
- ✅ Employee Salary page (`/sfa/hr/employee-salary`)
- ✅ Employee Salary API (`/api/sfa/hr/employee-salary`)

---

## 📝 To Be Implemented

### 1. PENDING SALARY PAGE

**Location:** `src/app/(app)/sfa/hr/pending-salary/page.tsx`

**Features:**
- Month selector dropdown (current month default)
- Shows all employees with:
  - Employee name & code
  - Monthly salary amount
  - Present days
  - Absent days
  - Paid leave days
  - Absent deduction amount
  - Advance deduction amount (if any active advance)
  - Net payable amount
- Click employee → Show detailed breakdown:
  - Which dates were absent (with reasons from Leave Request if any)
  - Which dates were paid leave
  - Advance installment details for that month

**Calculation Logic:**
```typescript
const daysInMonth = new Date(year, month + 1, 0).getDate();
const perDayRate = monthlySalary / daysInMonth;

// Count attendance
const presentDays = attendance.filter(a => a.status === "present").length;
const paidLeaveDays = attendance.filter(a => a.status === "paid_leave").length;
const absentDays = daysInMonth - presentDays - paidLeaveDays;

// Deductions
const absentDeduction = absentDays * perDayRate;
const advanceDeduction = getActiveInstallmentForMonth(employeeId, month);

// Net payable
const netPayable = monthlySalary - absentDeduction - advanceDeduction;
```

**API Endpoint:** `/api/sfa/hr/pending-salary?month=2024-11`

---

### 2. SALARY PAYMENT PAGE

**Location:** `src/app/(app)/sfa/hr/salary-payment/page.tsx`

**Features:**
- **Main view:** List of all salary payments (history)
  - Employee, Month, Payment Date, Amount Paid
  - Click to view details

- **"Give Payment" button** (top right):
  - Opens dialog
  - Select Employee
  - Select Month
  - Auto-fills pending salary amount from Pending Salary calculation
  - Shows breakdown:
    - Base Salary: ₹XX,XXX
    - Absent Days: X days (-₹X,XXX)
    - Paid Leave: X days (₹0 deduction)
    - Advance Deduction: -₹X,XXX
    - **Net Payable: ₹XX,XXX**
  - Payment Date picker
  - Payment Mode dropdown (Cash/Bank Transfer/Cheque)
  - Remarks (optional)
  - "Confirm Payment" button

**When payment is made:**
1. Create record in `SalaryPayment` collection
2. If employee has active advance with installment:
   - Mark that month's installment as "deducted"
   - Update `totalDeducted` and `remainingAmount`
   - If remainingAmount === 0, mark advance as "completed"

**API Endpoints:**
- GET `/api/sfa/hr/salary-payment` - List all payments
- POST `/api/sfa/hr/salary-payment` - Record new payment
- GET `/api/sfa/hr/salary-payment/[id]` - Get payment details

---

### 3. ADVANCED PAYMENT PAGE

**Location:** `src/app/(app)/sfa/hr/advanced-payment/page.tsx`

**Features:**

**Main View:**
- Shows all advances (active, completed, closed)
- Filters: Status (Active/Completed/Closed), Employee
- Columns:
  - Employee Name
  - Advance Amount
  - Payment Type (One-time/Installment)
  - Given Date
  - Total Deducted
  - Remaining
  - Status
- Click employee row → Show installment details page

**"Give Advanced" Button:**
Opens dialog with:
1. **Select Employee** (dropdown)
2. **Advance Amount** (₹ input)
3. **Payment Type:**
   - Radio buttons: "One-time Deduction" or "Installment"

   **If One-time selected:**
   - "Deduct from month" dropdown

   **If Installment selected:**
   - "Per month installment amount" (₹ input)
   - "Installment from month" dropdown
   - Auto-calculate: Total months = Advance Amount / Installment Amount
   - Show preview: "X installments of ₹X,XXX from YYYY-MM to YYYY-MM"

4. **Given Date** (auto-filled to today)
5. **"Confirm & Give" button**

**When advanced is given:**
1. Create record in `AdvancedPayment`
2. If installment type:
   - Generate installment array with months and amounts
   - Each installment status = "pending"
3. Status = "active"

**Installment Details Page:**
When clicking an employee with installments, show:
- All installments in a table:
  - Month
  - Amount
  - Status (Pending/Deducted/Passed/Skipped)
  - Actions

**Actions per installment:**
- **If status = "Pending" and month has arrived:**
  - Shows "Will be deducted in salary payment"

- **If deducted:**
  - Shows deduction date
  - "Pass Month" button:
    - On click → Shows dialog:
      - "Add this amount to next month installment?" Yes/No
      - If Yes: Add to next month's installment amount
      - If No: Shift all future installments forward by 1 month
    - Mark current as "passed"

- **"Force Close" button** (for entire advance):
  - Marks advance as "closed"
  - Stops all future deductions
  - Remaining amount is forgiven

**API Endpoints:**
- GET `/api/sfa/hr/advanced-payment` - List advances
- POST `/api/sfa/hr/advanced-payment` - Give new advance
- GET `/api/sfa/hr/advanced-payment/[id]` - Get advance details
- PATCH `/api/sfa/hr/advanced-payment/[id]/pass-month` - Pass a month
- PATCH `/api/sfa/hr/advanced-payment/[id]/force-close` - Close advance

---

### 4. LEAVE REQUEST PAGE (Updated)

**Location:** `src/app/(app)/sfa/hr/leave-request/page.tsx`

**Features:**
- Shows all leave requests from mobile app
- Columns:
  - Employee
  - Leave Type (Leave / Paid Leave)
  - From Date
  - To Date
  - Days
  - Reason
  - Status (Pending/Approved/Rejected)
  - Requested On
- Filters: Status, Employee, Leave Type

**Actions:**
- Click row → Open review dialog:
  - Shows all details
  - "Approve" or "Reject" buttons
  - Remarks field

**When Approved (Paid Leave):**
1. Update LeaveRequest status = "approved"
2. For each date in range (fromDate to toDate):
   - Create/update EmployeeAttendance record:
     - status = "paid_leave"
     - absentReason = leave reason
     - leaveRequestId = leave request ID
3. Update PaidLeaveBalance:
   - used += totalDays
   - remaining -= totalDays

**When Approved (Regular Leave):**
1. Update LeaveRequest status = "approved"
2. For each date in range:
   - Create EmployeeAttendance with status = "absent"
   - absentReason = leave reason

**API Endpoints:**
- GET `/api/sfa/hr/leave-request` - List all requests
- PATCH `/api/sfa/hr/leave-request/[id]/review` - Approve/reject

---

### 5. MOBILE APP - LEAVE APPLICATION

**Location:** `mobile-labs/lib/screens/leave_application_screen.dart`

**Features:**
- Employee can apply for leave from mobile app
- Two types:
  1. **Leave** (Unpaid - unlimited)
  2. **Paid Leave** (Maximum 12 days per year)

**Form Fields:**
- **Leave Type** (Radio buttons):
  - "Leave" (regular/unpaid)
  - "Paid Leave" (limited to 12 days/year)

- **From Date** (date picker)
- **To Date** (date picker)
- **Auto-calculate:** Total Days
- **Reason** (text area, required)

**Validation:**
- If "Paid Leave" selected:
  - Check remaining paid leave balance for current year
  - If days > remaining: Show error "You have only X paid leave days remaining"
  - Minimum 1 day, maximum 2 days per application
- If "Leave" selected:
  - No limit on days
  - Minimum 1 day

**After submission:**
- Create LeaveRequest with status = "pending"
- Show success message: "Leave request submitted for admin review"

**API Endpoints:**
- POST `/api/labs/leave-request` - Submit leave application
- GET `/api/labs/leave-request/balance` - Get paid leave balance

---

### 6. ATTENDANCE AUTO-UPDATE

**When Punch In/Out happens:**

Existing punch in/out APIs already create Attendance records. We need to ensure:

1. **Punch In:**
   - Creates Attendance record with status = "present"
   - Sets punchInTime

2. **Punch Out:**
   - Calculate hours worked
   - If hours < 2:
     - status = "absent"
     - absentReason = "Less than 2 hours worked"
   - If hours >= 2:
     - status = "present"

This logic should already exist. Just verify the 2-hour minimum is enforced.

---

## 🔢 Salary Calculation Formulas

### Per Day Rate
```typescript
const perDayRate = monthlySalary / daysInMonth;
```

### Absent Deduction
```typescript
const absentDeduction = absentDays * perDayRate;
```

### Paid Leave
```typescript
// Paid leave days are counted as present
// No deduction for paid leave days
const paidLeaveDeduction = 0;
```

### Advance Deduction
```typescript
// Get active advance for employee
const advance = await AdvancedPaymentModel.findOne({
  employeeId,
  status: "active"
});

if (!advance) return 0;

if (advance.paymentType === "one_time") {
  // Check if this is the deduction month
  if (advance.deductFromMonth === selectedMonth) {
    return advance.advanceAmount;
  }
  return 0;
}

// For installments
const installment = advance.installments.find(
  inst => inst.month === selectedMonth && inst.status === "pending"
);

return installment?.amount || 0;
```

### Net Payable
```typescript
const netPayable = monthlySalary - absentDeduction - advanceDeduction;
```

---

## 🗄️ Database Indexes (Already set in models)

All necessary indexes are already defined in the Mongoose schemas.

---

## 🧪 Testing Checklist

### Employee Salary
- [ ] Set salary for new employee
- [ ] Update existing salary
- [ ] View salary history

### Attendance
- [ ] Punch in creates attendance
- [ ] Punch out with < 2 hours marks absent
- [ ] Punch out with >= 2 hours marks present
- [ ] View monthly attendance per employee

### Pending Salary
- [ ] Calculate correctly with present/absent/paid leave
- [ ] Show advance deduction if applicable
- [ ] View detailed breakdown per employee

### Salary Payment
- [ ] Give salary payment
- [ ] Auto-deduct advance installment
- [ ] Mark installment as deducted
- [ ] Complete advance when fully paid

### Advanced Payment
- [ ] Give one-time advance
- [ ] Give installment advance
- [ ] Auto-generate installment schedule
- [ ] Pass month (with/without adding to next)
- [ ] Force close advance

### Leave Request
- [ ] Mobile app applies leave
- [ ] Paid leave checks 12-day limit
- [ ] Paid leave limited to 2 days per application
- [ ] Admin approves/rejects
- [ ] Approval updates attendance
- [ ] Paid leave balance updates

---

## 📁 File Structure Summary

```
src/
├── models/
│   ├── EmployeeSalary.ts ✅
│   ├── EmployeeAttendance.ts ✅
│   ├── SalaryPayment.ts ✅
│   ├── AdvancedPayment.ts ✅
│   ├── LeaveRequest.ts ✅
│   └── PaidLeaveBalance.ts ✅
│
├── app/(app)/sfa/hr/
│   ├── employee-salary/page.tsx ✅
│   ├── pending-salary/page.tsx ⏳
│   ├── salary-payment/page.tsx ⏳
│   ├── advanced-payment/page.tsx ⏳
│   └── leave-request/page.tsx ⏳
│
├── app/api/sfa/hr/
│   ├── employee-salary/route.ts ✅
│   ├── pending-salary/route.ts ⏳
│   ├── salary-payment/route.ts ⏳
│   ├── salary-payment/[id]/route.ts ⏳
│   ├── advanced-payment/route.ts ⏳
│   ├── advanced-payment/[id]/route.ts ⏳
│   ├── advanced-payment/[id]/pass-month/route.ts ⏳
│   ├── advanced-payment/[id]/force-close/route.ts ⏳
│   ├── leave-request/route.ts ⏳
│   └── leave-request/[id]/review/route.ts ⏳
│
└── app/api/labs/
    ├── leave-request/route.ts ⏳
    └── leave-request/balance/route.ts ⏳

mobile-labs/
└── lib/screens/
    └── leave_application_screen.dart ⏳
```

---

## 🚀 Implementation Order

1. ✅ Employee Salary (Done)
2. Pending Salary calculation
3. Salary Payment with deductions
4. Advanced Payment (one-time)
5. Advanced Payment (installments)
6. Leave Request approval
7. Mobile leave application
8. Testing & bug fixes

---

This guide contains all the logic and structure needed. Each section can be implemented independently. Let me know which feature you want me to build first in full detail!
