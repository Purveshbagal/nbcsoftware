# Visit Management API Guide

## Complete Visit Workflow

### 1. Plan a Visit (Create Planned Visit)

**Endpoint**: `POST /api/labs/visits/plan`

**Request Body**:
```json
{
  "doctorId": "66abc...",
  "doctorName": "Dr. Sharma",
  "plannedDate": "2026-10-30",
  "modeOfTransport": "Bike"
}
```

**Response**:
```json
{
  "visit": {
    "_id": "visit123",
    "status": "planned",
    "doctor": "Dr. Sharma",
    "plannedDate": "2026-10-30",
    "modeOfTransport": "Bike"
  }
}
```

---

### 2. Get Planned/Open Visits

**Endpoint**: `GET /api/labs/visits?status=planned`

**Query Params**:
- `status=planned` - Get planned visits
- `status=open` - Get ongoing visits
- `date=2026-10-30` - Filter by date

**Response**:
```json
{
  "items": [
    {
      "_id": "visit123",
      "doctor": "Dr. Sharma",
      "plannedDate": "2026-10-30",
      "status": "planned",
      "modeOfTransport": "Bike",
      "clinicAddress": "...",
      "geo": { "lat": 19.123, "lng": 72.456 }
    }
  ]
}
```

---

### 3. Start Visit (Check In)

**Endpoint**: `PUT /api/labs/visits/:visitId/check-in`

**Request Body**:
```json
{
  "lat": 19.123,
  "lng": 72.456,
  "accuracy": 10
}
```

**Response**:
```json
{
  "visit": {
    "_id": "visit123",
    "status": "open",
    "checkInAt": "2026-10-30T10:30:00Z"
  }
}
```

---

### 4. Update Visit Details (While Visit is Open)

**Endpoint**: `PUT /api/labs/visits/:visitId`

**Request Body**:
```json
{
  "remarks": "Good discussion",
  "extraInfo": "Interested in new products",
  "photos": ["base64..."],
  "presentationShown": true,
  "presentationId": "pres123"
}
```

---

### 5. Close Visit - Step 1: Met Doctor?

**Endpoint**: `PUT /api/labs/visits/:visitId/close`

**Request Body (if NOT met)**:
```json
{
  "metDoctor": false,
  "notMetReason": "Doctor was in surgery"
}
```

**Response**: Visit closes with status "skipped"

**Request Body (if MET)**:
```json
{
  "metDoctor": true,
  "productsPromoted": [
    {
      "productId": "prod1",
      "productName": "BACTOMUST 5GM OINTMENT",
      "isPrescribing": true,
      "isTop5": false
    },
    {
      "productId": "prod2",
      "productName": "DUOTWIST LD RESPULES",
      "isPrescribing": false,
      "isTop5": true
    }
  ],
  "samplesGiven": [
    {
      "productId": "prod1",
      "productName": "BACTOMUST 5GM OINTMENT",
      "quantity": 5
    }
  ]
}
```

**Response**: Visit closes with status "closed"

---

### 6. Get Active Presentations

**Endpoint**: `GET /api/labs/presentations`

**Response**:
```json
{
  "presentations": [
    {
      "_id": "pres123",
      "title": "New Product Launch 2026",
      "description": "Details about...",
      "fileUrl": "https://...",
      "fileType": "pdf",
      "products": ["Product A", "Product B"]
    }
  ]
}
```

---

### 7. Get Products List (for promotion selection)

**Endpoint**: `GET /api/labs/products`

Already exists - returns list of products

---

## Admin APIs

### Upload Presentation

**Endpoint**: `POST /api/presentations`

**Request Body**:
```json
{
  "title": "Product Launch 2026",
  "description": "...",
  "fileUrl": "https://...",
  "fileType": "pdf",
  "products": ["Product A"],
  "isActive": true
}
```

---

### Get All Presentations (Admin)

**Endpoint**: `GET /api/presentations`

**Response**: List of all presentations with view count, etc.

---

### Visit Analytics

**Endpoint**: `GET /api/sfa/visits/analytics`

**Query Params**:
- `employeeId` - Filter by employee
- `startDate` - Start date
- `endDate` - End date

**Response**:
```json
{
  "totalVisits": 150,
  "closedVisits": 120,
  "skippedVisits": 10,
  "plannedVisits": 20,
  "doctorsMet": 110,
  "productsPromoted": {
    "Product A": 50,
    "Product B": 30
  },
  "samplesGiven": {
    "Product A": 200,
    "Product B": 150
  }
}
```

---

## Mobile App Flow Summary

### Racer App Visit Flow:

1. **Plan Visit**
   - User selects doctor from list
   - Selects date
   - Selects transport mode
   - Clicks Save → `POST /api/labs/visits/plan`

2. **View Planned Visits**
   - `GET /api/labs/visits?status=planned`
   - Shows list with "Get Direction" button

3. **Get Direction**
   - Uses doctor's location from doctor record
   - Opens Google Maps with direction

4. **Start Visit**
   - User arrives at location
   - Clicks on visit → Opens visit detail screen
   - Shows "I Am Here" button
   - User fills: Take Picture, Remarks, Extra Info

5. **Show Presentation**
   - User clicks "I Am Here"
   - "Show Presentation" button appears
   - Fetches: `GET /api/labs/presentations`
   - User can view/show to doctor

6. **Close Visit**
   - User clicks "Close Visit"
   - Dialog: "Did you meet the doctor?"
   - **If NO**: Ask reason → Submit
   - **If YES**: Show products promoted screen

7. **Products Promoted**
   - Shows product list
   - User toggles "Is Prescribing" and "Top 5"
   - Clicks Next

8. **Samples Given**
   - Shows product list
   - User enters quantity for each
   - Clicks Submit
   - `PUT /api/labs/visits/:visitId/close` with all data

9. **Complete**
   - Visit status = "closed"
   - Syncs to admin dashboard

---

## Database Schema Changes

### Visit Model Updates
- `plannedDate` - Date when visit was planned
- `modeOfTransport` - Bike/Car/Public Transport
- `extraInfo` - Additional info field
- `productsPromoted[]` - Array of {productId, productName, isPrescribing, isTop5}
- `samplesGiven[]` - Array of {productId, productName, quantity}
- `photos[]` - Array of photo URLs/base64
- `metDoctor` - Boolean
- `notMetReason` - String
- `presentationShown` - Boolean
- `presentationId` - String

### New Presentation Model
- Complete model for managing presentation files
- Tracks view count and usage

