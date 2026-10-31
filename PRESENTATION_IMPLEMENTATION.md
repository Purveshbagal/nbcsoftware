# Presentation Module Implementation Guide

## Overview
The Presentation module has been migrated from Survey NBC to Racer NBC and integrated into the mobile app visit flow. This document explains the complete implementation.

## Architecture Changes

### Previous Setup (Before Migration)
- **Survey NBC**: Had a separate Presentation model and menu item
- **Racer NBC**: Already had presentations using MediaAsset model
- **Mobile App**: Used the old Presentation model API

### Current Setup (After Migration)
- **Survey NBC**: Presentation menu removed (no longer in this workspace)
- **Racer NBC**: Centralized presentation management using MediaAsset model
- **Mobile App**: Updated to use MediaAsset presentations (same as Racer NBC)

## Database Models

### MediaAsset Model
**Location**: [src/models/MediaAsset.ts](src/models/MediaAsset.ts)

Used for both presentations and media in Racer NBC and mobile app.

```typescript
{
  kind: "presentation" | "media",  // "presentation" for presentation items
  title: String (required),
  description: String,
  url: String,              // URL to presentation file
  fileType: String,         // e.g., "PDF", "PPT", "Image", "Video"
  division: String,         // Division assignment
  campaign: String,         // Campaign assignment
  isActive: Boolean,        // Active status
  createdBy: {
    username: String,
    name: String
  },
  timestamps: true
}
```

### Visit Model (Updated)
**Location**: [src/models/Visit.ts](src/models/Visit.ts)

Tracks presentations shown during doctor/firm visits.

```typescript
{
  // New field - supports multiple presentations per visit
  presentationsShown: [
    {
      presentationId: String,
      presentationTitle: String,
      shownAt: Date
    }
  ],

  // Legacy fields - kept for backward compatibility
  presentationShown: Boolean,
  presentationId: String
}
```

## Web Interface (Racer NBC)

### Navigation Path
**Racer NBC → Workplace → E-detailing → Presentation**

**Location**: [src/app/(app)/sfa/e-detailing/presentation/page.tsx](src/app/(app)/sfa/e-detailing/presentation/page.tsx)

### Features
- Create, Read, Update, Delete (CRUD) presentations
- Filter by Division and Campaign
- Upload presentation files (PDF, PPT, Images, Videos, etc.)
- Set active/inactive status
- Share infrastructure with Media Gallery

### Form Fields
- **Title** (required): Presentation name
- **URL**: Link to presentation file
- **File Type**: PDF, Image, Video, Slides, Other
- **Division**: Division assignment
- **Campaign**: Campaign assignment
- **Description**: Detailed description
- **Is Active**: Enable/disable presentation

### API Endpoint
**Endpoint**: `/api/sfa/media`
**Filter**: `{ kind: "presentation" }`

## Mobile App Integration

### API Endpoints

#### 1. Get Presentations List
```
GET /api/labs/presentations
```

**Authentication**: Requires employee token

**Response**:
```json
{
  "presentations": [
    {
      "_id": "...",
      "title": "Product Launch Presentation",
      "description": "New product details",
      "fileUrl": "https://...",
      "fileType": "PDF",
      "division": "PEDIA",
      "campaign": "Q4 Campaign"
    }
  ]
}
```

**Features**:
- Returns only active presentations (`isActive: true`)
- Filters by `kind: "presentation"`
- Limited to 50 presentations
- Sorted by creation date (newest first)

#### 2. Update Visit with Presentation
```
PUT/PATCH /api/labs/visits/{visitId}
```

**Request Body**:
```json
{
  "presentationsShown": [
    {
      "presentationId": "...",
      "presentationTitle": "Product Launch Presentation",
      "shownAt": "2024-10-31T12:30:00Z"
    }
  ]
}
```

## Mobile App Visit Flow

The presentation step is integrated into the visit flow between "Products Promoted" and "Samples Given".

### Visit Flow Sequence

1. **Start Visit** - Employee checks in at doctor/firm location
2. **Products Promoted** - Select products promoted during visit
3. **📊 PRESENTATION** ← NEW STEP
   - Show available presentations
   - Employee can show one or multiple presentations to doctor
   - Track which presentations were shown
4. **Samples Given** - Record samples given to doctor
5. **Done** - Complete any remaining fields
6. **Close Visit** - Submit and close the visit

### Mobile App Implementation Requirements

The mobile app should implement the following flow:

#### 1. Products Promoted Screen
After employee completes "Products Promoted", show **Continue** button.

#### 2. Presentation Screen (New)
```
┌─────────────────────────────────────┐
│  Presentations                      │
├─────────────────────────────────────┤
│                                     │
│  Select presentations shown to      │
│  the doctor:                        │
│                                     │
│  ☐ Product Launch - Q4 2024        │
│  ☐ New Pediatric Range             │
│  ☐ Clinical Study Results          │
│  ☐ Dosage Guidelines               │
│                                     │
│  [Skip]        [Continue]          │
└─────────────────────────────────────┘
```

**Features**:
- Fetch presentations from `/api/labs/presentations`
- Filter by employee's division (optional)
- Allow multiple selection
- Each selected presentation gets added to `presentationsShown` array
- Track timestamp when shown (`shownAt`)

**Code Example**:
```typescript
// Fetch presentations
const response = await fetch('/api/labs/presentations', {
  headers: {
    'Authorization': `Bearer ${employeeToken}`
  }
});
const { presentations } = await response.json();

// When user selects presentations
const selectedPresentations = presentations
  .filter(p => selectedIds.includes(p._id))
  .map(p => ({
    presentationId: p._id,
    presentationTitle: p.title,
    shownAt: new Date()
  }));

// Add to visit update
visitData.presentationsShown = selectedPresentations;
```

#### 3. Samples Given Screen
Continue with existing samples given flow.

#### 4. Visit Submission
When closing visit, the `presentationsShown` data is automatically included in the visit record.

### Optional: Presentation Viewer

You can optionally implement a viewer to show the presentation:

```
┌─────────────────────────────────────┐
│  Product Launch - Q4 2024          │
├─────────────────────────────────────┤
│                                     │
│  [PDF Viewer / Image / Video]      │
│                                     │
│                                     │
│  [Close]        [Mark as Shown]    │
└─────────────────────────────────────┘
```

## File References

### Modified Files
1. [src/lib/workspaces.ts:154-155](src/lib/workspaces.ts#L154-L155) - Removed presentation from Survey NBC sidebar
2. [src/lib/workspaces.ts:308](src/lib/workspaces.ts#L308) - Removed `/presentations` prefix from Survey NBC
3. [src/app/api/labs/presentations/route.ts](src/app/api/labs/presentations/route.ts) - Updated to use MediaAsset model
4. [src/models/Visit.ts:58-69](src/models/Visit.ts#L58-L69) - Added `presentationsShown` array field

### Key Existing Files
1. [src/models/MediaAsset.ts](src/models/MediaAsset.ts) - MediaAsset model with `kind` field
2. [src/app/(app)/sfa/e-detailing/presentation/page.tsx](src/app/(app)/sfa/e-detailing/presentation/page.tsx) - Racer NBC UI
3. [src/app/api/sfa/media/route.ts](src/app/api/sfa/media/route.ts) - Racer NBC API
4. [src/app/api/labs/visits/[visitId]/route.ts](src/app/api/labs/visits/[visitId]/route.ts) - Visit update API

## Testing Checklist

### Web Testing (Racer NBC)
- [ ] Navigate to Racer NBC → Workplace → E-detailing → Presentation
- [ ] Create a new presentation
- [ ] Verify presentation appears in list
- [ ] Edit existing presentation
- [ ] Delete presentation
- [ ] Filter by Division and Campaign
- [ ] Toggle active/inactive status

### Mobile API Testing
- [ ] Test `GET /api/labs/presentations` with valid employee token
- [ ] Verify only active presentations are returned
- [ ] Verify presentations have correct fields (title, fileUrl, etc.)
- [ ] Test presentation filtering by division

### Visit Flow Testing
- [ ] Start a doctor visit in mobile app
- [ ] Complete "Products Promoted"
- [ ] Navigate to Presentation screen
- [ ] Select one or more presentations
- [ ] Verify presentations are tracked in visit
- [ ] Complete "Samples Given" and close visit
- [ ] Verify `presentationsShown` field in visit record

### Survey NBC Testing
- [ ] Verify presentation menu item is removed from Survey NBC sidebar
- [ ] Verify `/presentations` route is no longer accessible in Survey NBC

## Migration Notes

### For Existing Presentations
If you have existing presentations in the old `presentations` collection, you need to migrate them to `mediaassets` collection:

```javascript
// Migration script (run in MongoDB)
db.presentations.find({ isActive: true }).forEach(function(presentation) {
  db.mediaassets.insertOne({
    kind: "presentation",
    title: presentation.title,
    description: presentation.description,
    url: presentation.fileUrl,
    fileType: presentation.fileType,
    division: presentation.division,
    campaign: presentation.category,  // Map category to campaign
    isActive: presentation.isActive,
    createdBy: presentation.createdBy,
    createdAt: presentation.createdAt,
    updatedAt: presentation.updatedAt
  });
});
```

### Backward Compatibility
The Visit model maintains legacy fields (`presentationShown`, `presentationId`) for backward compatibility with old visit records. New visits should use the `presentationsShown` array field.

## Support

For questions or issues, refer to:
- [Racer NBC E-detailing Documentation](src/app/(app)/sfa/e-detailing/)
- [Mobile Labs API Documentation](src/app/api/labs/)
- [Visit Model Schema](src/models/Visit.ts)

## Summary

✅ **Completed Changes**:
1. Removed presentation from Survey NBC workspace
2. Updated mobile API to use MediaAsset model
3. Enhanced Visit model to track multiple presentations
4. Presentation management now centralized in Racer NBC

🎯 **Next Steps**:
1. Implement presentation screen in mobile app
2. Add presentation step to visit flow (after Products Promoted)
3. Test complete flow from web to mobile
4. Optional: Migrate old presentations to new model

---
Last Updated: 2024-10-31
