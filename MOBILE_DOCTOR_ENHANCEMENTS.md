# Mobile-Labs Doctor Add Enhancements

## Overview
This document describes the enhancements made to the mobile-labs Android app for doctor registration functionality.

## New Features

### 1. Registration Number Field
Added a new "Registration Number" field to the doctor add form where employees can enter the doctor's medical registration number.

### 2. Camera & Storage Document Upload
Enhanced document upload to support both camera capture and file storage selection:
- **Camera Option**: Take a photo directly from camera to upload as document
- **Storage Option**: Select PDF or image files from device storage
- **Permission Handling**: Automatic camera permission request on first use

## Changes Made

### 1. Mobile App UI Changes

#### File: [mobile-labs/lib/screens/add_doctor_enhanced_screen.dart](mobile-labs/lib/screens/add_doctor_enhanced_screen.dart)

**Added Registration Number Field** (Line 288):
```dart
_text("registrationNumber", "Registration Number"),
```

The field appears in the form between "Mobile Number" and "Qualification".

**Enhanced Document Upload** (Lines 131-203):
- Shows dialog with "Camera" and "Storage" options
- Camera option uses `image_picker` package to capture photo
- Storage option uses `file_picker` for PDF/images
- Both convert files to base64 for API upload

**Camera Upload Implementation**:
```dart
Future<void> _pickDocument() async {
  // Show dialog to choose between Camera or Storage
  final choice = await showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text("Upload Document"),
      content: const Text("Choose upload source:"),
      actions: [
        TextButton.icon(
          onPressed: () => Navigator.pop(context, "camera"),
          icon: const Icon(Icons.camera_alt),
          label: const Text("Camera"),
        ),
        TextButton.icon(
          onPressed: () => Navigator.pop(context, "storage"),
          icon: const Icon(Icons.folder),
          label: const Text("Storage"),
        ),
      ],
    ),
  );

  if (choice == "camera") {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    // Process and add to documents...
  } else {
    // File picker for storage...
  }
}
```

### 2. Permissions Updates

#### File: [mobile-labs/android/app/src/main/AndroidManifest.xml](mobile-labs/android/app/src/main/AndroidManifest.xml)

**Added Camera Permission** (Line 19):
```xml
<!-- Camera permission for document upload via camera -->
<uses-permission android:name="android.permission.CAMERA"/>
```

#### File: [mobile-labs/lib/services/permissions.dart](mobile-labs/lib/services/permissions.dart)

**Updated Permission Request** (Lines 23-31):
```dart
static Future<void> requestAll() async {
  await Permission.locationWhenInUse.request();
  await Permission.camera.request();  // ← NEW
  if (await _androidSdk() < 33) {
    await Permission.storage.request();
  }
}
```

Camera permission is now requested along with location and storage permissions on first app launch.

#### File: [mobile-labs/lib/widgets/permission_prompt.dart](mobile-labs/lib/widgets/permission_prompt.dart)

**Updated Permission Dialog** (Lines 26-30):
```dart
_Row(
  icon: Icons.camera_alt_rounded,
  title: "Camera",
  detail: "To capture documents when adding doctors.",
),
```

The permission prompt now explains all three permissions: Location, Camera, and Storage.

### 3. Dependencies

#### File: [mobile-labs/pubspec.yaml](mobile-labs/pubspec.yaml)

**Added Image Picker Package** (Line 46):
```yaml
dependencies:
  file_picker: ^13.2.0
  image_picker: ^1.1.2  # ← NEW for camera support
  flutter_map: ^8.3.2
```

### 4. Backend API Updates

#### File: [src/app/api/labs/doctors/route.ts](src/app/api/labs/doctors/route.ts)

**Added registrationNumber to writable fields** (Line 18):
```typescript
const WRITABLE = [
  "prefix",
  "name",
  "hospitalName",
  "hospitalAddress",
  "speciality",
  "qualification",
  "registrationNumber",  // ← NEW
  "category",
  "contactNo",
  // ... other fields
] as const;
```

**Added registrationNumber to list fields** (Line 9):
```typescript
const LIST_FIELDS =
  "doctorCode uinId prefix name hospitalName hospitalAddress speciality qualification registrationNumber category contactNo email city pincode clinicAddress gender location bankDetails zone assignedEmployees approvalStatus";
```

The registration number is now saved to the database and returned when fetching doctor details.

## User Flow

### Adding a Doctor with Document Upload

1. **Open Add Doctor Screen**
   - Navigate to "Add Doctor" from doctors list
   - Form loads with all fields

2. **Fill Basic Information**
   - Doctor Name (required)
   - Mobile Number (required)
   - **Registration Number** ← NEW FIELD
   - Qualification (required dropdown)
   - Speciality (required dropdown)
   - Category and Gender (optional dropdowns)

3. **Fill Hospital Information**
   - Hospital Name (required)
   - Hospital Address
   - Email

4. **Upload Document** (Enhanced)
   - Click "Upload Document (PDF/Image)" button
   - **Dialog appears**: "Choose upload source"
     - **Camera**: Opens camera app to take photo
       - First time: Camera permission popup appears
       - User must allow camera access
       - Take photo → photo is added to documents
     - **Storage**: Opens file picker
       - Select PDF or image file
       - File is added to documents
   - Multiple documents can be uploaded
   - Each document shows in a list with delete option

5. **Other Sections**
   - Bank Details (optional)
   - Location picker (optional)

6. **Submit**
   - Click "Save Doctor"
   - Doctor is created with pending approval status
   - UIN ID is auto-generated
   - All documents are saved as base64 data

## Database Schema

The Doctor model already includes the `registrationNumber` field:

**Prisma Schema** ([prisma/schema.prisma](prisma/schema.prisma)):
```prisma
model Doctor {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  doctorCode         String?
  uinId              String?  @unique
  name               String
  registrationNumber String?  // ← Already exists in schema
  qualification      String?
  speciality         String?
  // ... other fields

  documents          DoctorDocument[]
  // ... rest of schema
}

type DoctorDocument {
  filename    String?
  mimeType    String?
  data        Bytes?
  uploadedAt  DateTime?
}
```

## Testing Guide

### 1. Test Registration Number Field

- [ ] Open Add Doctor screen
- [ ] Verify "Registration Number" field appears after "Mobile Number"
- [ ] Enter a registration number (e.g., "MH12345")
- [ ] Submit form and verify it's saved in database
- [ ] Fetch doctor and verify registration number is returned

### 2. Test Camera Upload

**First Time (Permission Request):**
- [ ] Open Add Doctor screen
- [ ] Click "Upload Document (PDF/Image)"
- [ ] Select "Camera" option
- [ ] Verify camera permission popup appears
- [ ] Deny permission → Should show error message
- [ ] Try again and allow permission
- [ ] Camera should open successfully
- [ ] Take photo and verify it's added to documents list

**Subsequent Uses:**
- [ ] Click upload button again
- [ ] Select "Camera"
- [ ] Camera should open directly (no permission popup)
- [ ] Take photo and verify it's added

### 3. Test Storage Upload

- [ ] Click "Upload Document (PDF/Image)"
- [ ] Select "Storage" option
- [ ] File picker should open
- [ ] Try to select invalid file type → Should not be selectable
- [ ] Select PDF file → Should be added to documents
- [ ] Select JPG/PNG image → Should be added to documents
- [ ] Verify multiple files can be added

### 4. Test Document Management

- [ ] Upload 2-3 documents (mix of camera and storage)
- [ ] Verify all show in the list with file names
- [ ] Click delete icon on one document
- [ ] Verify it's removed from the list
- [ ] Submit form with remaining documents
- [ ] Verify all documents are saved to database

### 5. Test Permission Dialog

**First App Launch:**
- [ ] Install app fresh
- [ ] First launch shows permission dialog
- [ ] Dialog should mention:
   - Location (for punch in/out)
   - **Camera (for capturing documents)** ← NEW
   - Storage (for downloads)
- [ ] Click "Allow"
- [ ] Verify all three permission popups appear in sequence

### 6. Test Complete Flow

- [ ] Add new doctor with all fields including registration number
- [ ] Upload document via camera
- [ ] Upload document via storage
- [ ] Pick location on map
- [ ] Fill bank details
- [ ] Submit form
- [ ] Verify success message shows UIN ID
- [ ] Verify doctor appears in doctors list
- [ ] Check admin panel for approval
- [ ] Verify all data including documents and registration number

## Installation Instructions

### For Developers

1. **Update Dependencies**
   ```bash
   cd mobile-labs
   flutter pub get
   ```

2. **Clean Build** (if issues occur)
   ```bash
   flutter clean
   flutter pub get
   flutter build apk
   ```

3. **Run App**
   ```bash
   flutter run
   ```

### For Testers

1. **Uninstall old version** (if needed)
2. **Install new APK**
3. **Grant all permissions** when prompted
4. **Test doctor add with camera upload**

## Troubleshooting

### Camera Not Opening

**Issue**: Camera permission denied or camera doesn't open

**Solutions**:
1. Go to Settings → Apps → NBC Labs → Permissions
2. Enable Camera permission manually
3. Restart the app
4. Try camera upload again

### Image Quality

**Issue**: Photos are too large or low quality

**Current Settings**:
```dart
maxWidth: 1920,
maxHeight: 1920,
imageQuality: 85,
```

These settings compress images to reasonable size while maintaining quality.

### File Picker Not Working

**Issue**: File picker doesn't show files or crashes

**Solutions**:
1. Ensure storage permission is granted
2. Check Android version (Android 13+ doesn't need storage permission)
3. Try with different file types
4. Update `file_picker` package if issues persist

### Permission Denied Loop

**Issue**: App keeps asking for permissions

**Solution**:
1. User might have selected "Don't ask again"
2. Guide user to Settings → Apps → NBC Labs → Permissions
3. Enable required permissions manually

## API Reference

### POST /api/labs/doctors

**New Field in Request**:
```json
{
  "name": "Dr. John Doe",
  "contactNo": "9876543210",
  "registrationNumber": "MH12345",  // ← NEW
  "qualification": "MBBS",
  "speciality": "Pediatrics",
  "hospitalName": "City Hospital",
  "documents": [
    "base64_encoded_string_1",
    "base64_encoded_string_2"
  ],
  // ... other fields
}
```

**Response**:
```json
{
  "item": {
    "_id": "...",
    "uinId": "RAC001234",
    "name": "Dr. John Doe",
    "registrationNumber": "MH12345",  // ← Included in response
    "contactNo": "9876543210",
    "qualification": "MBBS",
    "speciality": "Pediatrics",
    "approvalStatus": "pending",
    // ... other fields
  }
}
```

## File Changes Summary

### Modified Files
1. ✅ [mobile-labs/lib/screens/add_doctor_enhanced_screen.dart](mobile-labs/lib/screens/add_doctor_enhanced_screen.dart) - Added registration number field and camera upload
2. ✅ [mobile-labs/pubspec.yaml](mobile-labs/pubspec.yaml) - Added image_picker dependency
3. ✅ [mobile-labs/android/app/src/main/AndroidManifest.xml](mobile-labs/android/app/src/main/AndroidManifest.xml) - Added camera permission
4. ✅ [mobile-labs/lib/services/permissions.dart](mobile-labs/lib/services/permissions.dart) - Updated to request camera permission
5. ✅ [mobile-labs/lib/widgets/permission_prompt.dart](mobile-labs/lib/widgets/permission_prompt.dart) - Updated dialog to show camera permission
6. ✅ [src/app/api/labs/doctors/route.ts](src/app/api/labs/doctors/route.ts) - Added registrationNumber to API

### Dependencies Added
- `image_picker: ^1.1.2` - For camera capture functionality

## Screenshots Reference

### Before
```
┌─────────────────────────────────┐
│ Doctor Name *                   │
│ Mobile Number *                 │
│ Qualification *                 │  ← Registration Number missing
│ ...                             │
└─────────────────────────────────┘

[Upload Document] → File Picker Only
```

### After
```
┌─────────────────────────────────┐
│ Doctor Name *                   │
│ Mobile Number *                 │
│ Registration Number             │  ← NEW FIELD
│ Qualification *                 │
│ ...                             │
└─────────────────────────────────┘

[Upload Document] → Dialog:
  [Camera] [Storage]  ← NEW OPTIONS
```

## Support

For questions or issues:
- Backend API: [src/app/api/labs/doctors/route.ts](src/app/api/labs/doctors/route.ts)
- Mobile UI: [mobile-labs/lib/screens/add_doctor_enhanced_screen.dart](mobile-labs/lib/screens/add_doctor_enhanced_screen.dart)
- Permissions: [mobile-labs/lib/services/permissions.dart](mobile-labs/lib/services/permissions.dart)

---
**Last Updated**: 2024-10-31
**Version**: 1.0.0
