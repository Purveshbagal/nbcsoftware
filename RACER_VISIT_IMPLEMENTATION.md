# Racer App - Complete Visit Management Implementation Guide

## ✅ Backend Complete!

All backend APIs are ready and working. The following has been implemented:

### API Endpoints Created

1. **`POST /api/labs/visits/plan`** - Plan a new visit
2. **`GET /api/labs/visits?status=planned`** - Get planned visits
3. **`GET /api/labs/visits?status=open`** - Get open visits
4. **`PUT /api/labs/visits/:visitId/check-in`** - Check in to visit (I Am Here)
5. **`PUT /api/labs/visits/:visitId`** - Update visit (photos, remarks, etc.)
6. **`PUT /api/labs/visits/:visitId/close`** - Close visit with products/samples
7. **`GET /api/labs/presentations`** - Get active presentations
8. **`GET /api/labs/doctors`** - Get doctors with location data

### Database Schema Updated

Visit model now includes:
- `plannedDate` - When visit is planned for
- `modeOfTransport` - Bike/Car/Public Transport
- `metDoctor` - Boolean
- `notMetReason` - String
- `productsPromoted[]` - Array of products with isPrescribing and isTop5
- `samplesGiven[]` - Array of products with quantities
- `photos[]` - Array of photo URLs
- `presentationShown` - Boolean
- `presentationId` - Reference to presentation

---

## 📱 Mobile App Implementation Guide

### Required Flutter Packages

Add to `mobile-labs/pubspec.yaml`:

```yaml
dependencies:
  url_launcher: ^6.3.3  # Already added
  geolocator: ^14.1.1   # Already added
  google_maps_flutter: ^2.5.0  # For map display
  image_picker: ^1.0.7  # For taking photos
```

---

## Screen Structure

### 1. Visits Screen (List View)

**File**: `mobile-labs/lib/screens/visits_screen.dart`

**Features**:
- TabBar: "Planned" | "Open" | "Closed"
- List of visits grouped by status
- Each visit card shows:
  - Doctor name
  - Planned date
  - Mode of transport icon
  - Status badge
  - "Get Direction" button (if has location)
  - Tap to open visit details

**API Call**:
```dart
// Get planned visits
final response = await apiClient.get('/api/labs/visits?status=planned');

// Get open visits
final response = await apiClient.get('/api/labs/visits?status=open');
```

---

### 2. Add Visit Screen (Plan Visit)

**File**: Create `mobile-labs/lib/screens/add_visit_screen.dart`

**Form Fields**:
1. **Select Doctor** - Searchable dropdown
   - Fetch from: `GET /api/labs/doctors`
   - Display: Doctor name, Hospital name
   - Store: doctorId, doctorName

2. **Planned Date** - Date picker
   - Default: Tomorrow
   - Can select future dates

3. **Mode of Transport** - Radio buttons
   - Bike 🏍️
   - Car 🚗
   - Public Transport 🚌

4. **Save Button**

**API Call**:
```dart
await apiClient.post('/api/labs/visits/plan', {
  'doctorId': selectedDoctorId,
  'doctorName': selectedDoctorName,
  'plannedDate': '2026-10-30',
  'modeOfTransport': 'Bike',
});
```

**Response Handling**:
```dart
if (response.statusCode == 201) {
  // Show success message
  Navigator.pop(context);
  // Refresh visits list
}
```

---

### 3. Visit Detail Screen (Open Visit)

**File**: Create `mobile-labs/lib/screens/visit_detail_screen.dart`

**Layout**:

```
┌─────────────────────────────────────┐
│  Dr. Sharma                        │
│  City Hospital, Pune               │
│  Planned: Oct 30, 2026             │
│  Mode: Bike 🏍️                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  [📸 Take Picture]                  │
│  Photo 1, Photo 2 (if added)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Objective/Remark:                 │
│  [___________________________]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Extra Info:                       │
│  [___________________________]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  [I AM HERE] ← Big blue button     │
└─────────────────────────────────────┘

After "I Am Here" clicked:

┌─────────────────────────────────────┐
│  [📊 Show Presentation]             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  [CLOSE VISIT] ← Red button        │
└─────────────────────────────────────┘
```

**State Management**:
```dart
bool hasCheckedIn = false;
List<String> photos = [];
bool presentationShown = false;
```

**Check-In Flow**:
```dart
Future<void> checkIn() async {
  // Get current location
  Position position = await Geolocator.getCurrentPosition();

  // Call API
  await apiClient.put('/api/labs/visits/${visit.id}/check-in', {
    'lat': position.latitude,
    'lng': position.longitude,
    'accuracy': position.accuracy,
  });

  setState(() {
    hasCheckedIn = true;
    visit.status = 'open';
  });
}
```

**Take Picture**:
```dart
import 'package:image_picker/image_picker.dart';

Future<void> takePicture() async {
  final ImagePicker picker = ImagePicker();
  final XFile? photo = await picker.pickImage(source: ImageSource.camera);

  if (photo != null) {
    // Convert to base64
    final bytes = await photo.readAsBytes();
    final base64Image = base64Encode(bytes);

    setState(() {
      photos.add(base64Image);
    });

    // Update visit
    await apiClient.put('/api/labs/visits/${visit.id}', {
      'photos': photos,
    });
  }
}
```

**Update Remarks**:
```dart
Future<void> updateRemarks() async {
  await apiClient.put('/api/labs/visits/${visit.id}', {
    'remarks': remarksController.text,
    'extraInfo': extraInfoController.text,
  });
}
```

---

### 4. Presentation Viewer Screen

**File**: Create `mobile-labs/lib/screens/presentation_viewer_screen.dart`

**Features**:
- Fetch presentations from API
- Display in grid/list
- Tap to open presentation (PDF/PPT/Image)
- Mark as shown

**API Call**:
```dart
final response = await apiClient.get('/api/labs/presentations');
final presentations = response.data['presentations'];
```

**Open Presentation**:
```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> openPresentation(String fileUrl, String presentationId) async {
  // Open in browser or external viewer
  if (await canLaunchUrl(Uri.parse(fileUrl))) {
    await launchUrl(Uri.parse(fileUrl), mode: LaunchMode.externalApplication);

    // Mark as shown
    await apiClient.put('/api/labs/visits/${visit.id}', {
      'presentationShown': true,
      'presentationId': presentationId,
    });
  }
}
```

---

### 5. Close Visit Dialog

**Features**:
- Dialog: "Did you meet the doctor?"
- Two buttons: YES | NO

**If NO**:
```dart
Future<void> closeVisitNotMet() async {
  // Show reason dialog
  String? reason = await showReasonDialog();

  if (reason != null) {
    await apiClient.put('/api/labs/visits/${visit.id}/close', {
      'metDoctor': false,
      'notMetReason': reason,
    });

    // Navigate back
    Navigator.popUntil(context, (route) => route.isFirst);
  }
}
```

**If YES**:
- Navigate to Products Promoted Screen

---

### 6. Products Promoted Screen

**File**: Create `mobile-labs/lib/screens/products_promoted_screen.dart`

**Exact Layout from Screenshot**:

```
┌─────────────────────────────────────────────────────┐
│  Drugs Promoted during this call                   │
│  [EDIT ⚪]                                          │
│                                                      │
│  Name            Is Prescribing    Top 5           │
│  ──────────────────────────────────────────────    │
│  BACTOMUST       ⚪────⚪           ☐               │
│  5GM OINTMENT                                       │
│  ──────────────────────────────────────────────    │
│  DUOTWIST LD     ⚪────⚪           ☐               │
│  RESPULES                                           │
│  ──────────────────────────────────────────────    │
│                                                      │
│  [NEXT]                                             │
└─────────────────────────────────────────────────────┘
```

**Data Structure**:
```dart
class ProductPromoted {
  String productId;
  String productName;
  bool isPrescribing;
  bool isTop5;
}

List<ProductPromoted> productsPromoted = [];
```

**Fetch Products**:
```dart
// Get all products
final response = await apiClient.get('/api/labs/products');
final products = response.data['items'];

// Initialize with isPrescribing and isTop5 = false
setState(() {
  productsPromoted = products.map((p) => ProductPromoted(
    productId: p['_id'],
    productName: p['productName'],
    isPrescribing: false,
    isTop5: false,
  )).toList();
});
```

**UI Implementation**:
```dart
ListView.builder(
  itemCount: productsPromoted.length,
  itemBuilder: (context, index) {
    final product = productsPromoted[index];

    return ListTile(
      title: Text(product.productName),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Is Prescribing Toggle
          Switch(
            value: product.isPrescribing,
            onChanged: (value) {
              setState(() {
                productsPromoted[index].isPrescribing = value;
              });
            },
          ),
          SizedBox(width: 20),
          // Top 5 Checkbox
          Checkbox(
            value: product.isTop5,
            onChanged: (value) {
              setState(() {
                productsPromoted[index].isTop5 = value ?? false;
              });
            },
          ),
        ],
      ),
    );
  },
)
```

**Next Button**:
```dart
// Navigate to Samples Given screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => SamplesGivenScreen(
      visitId: visit.id,
      products: products,
      productsPromoted: productsPromoted,
    ),
  ),
);
```

---

### 7. Samples Given Screen

**File**: Create `mobile-labs/lib/screens/samples_given_screen.dart`

**Layout**:

```
┌─────────────────────────────────────────────────────┐
│  Samples Given                                     │
│                                                      │
│  Name                      Qty                      │
│  ──────────────────────────────────────────────    │
│  BACTOMUST 5GM OINTMENT    [  5  ]                 │
│  ──────────────────────────────────────────────    │
│  DUOTWIST LD RESPULES      [  0  ]                 │
│  ──────────────────────────────────────────────    │
│                                                      │
│  [SUBMIT]                                           │
└─────────────────────────────────────────────────────┘
```

**Data Structure**:
```dart
class SampleGiven {
  String productId;
  String productName;
  int quantity;
}

List<SampleGiven> samplesGiven = [];
```

**Initialize**:
```dart
setState(() {
  samplesGiven = widget.products.map((p) => SampleGiven(
    productId: p['_id'],
    productName: p['productName'],
    quantity: 0,
  )).toList();
});
```

**UI**:
```dart
ListView.builder(
  itemCount: samplesGiven.length,
  itemBuilder: (context, index) {
    final sample = samplesGiven[index];

    return ListTile(
      title: Text(sample.productName),
      trailing: SizedBox(
        width: 100,
        child: TextField(
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            border: OutlineInputBorder(),
            hintText: '0',
          ),
          onChanged: (value) {
            samplesGiven[index].quantity = int.tryParse(value) ?? 0;
          },
        ),
      ),
    );
  },
)
```

**Submit Button**:
```dart
Future<void> submitVisit() async {
  // Close visit with all data
  await apiClient.put('/api/labs/visits/${widget.visitId}/close', {
    'metDoctor': true,
    'productsPromoted': widget.productsPromoted.map((p) => {
      'productId': p.productId,
      'productName': p.productName,
      'isPrescribing': p.isPrescribing,
      'isTop5': p.isTop5,
    }).toList(),
    'samplesGiven': samplesGiven
        .where((s) => s.quantity > 0)
        .map((s) => {
          'productId': s.productId,
          'productName': s.productName,
          'quantity': s.quantity,
        })
        .toList(),
  });

  // Show success message
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Visit closed successfully!')),
  );

  // Navigate back to visits list
  Navigator.popUntil(context, (route) => route.isFirst);
}
```

---

### 8. Get Directions

**Integration with Google Maps**:

```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> openDirections(double lat, double lng) async {
  // Google Maps URL with directions
  final url = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng';

  if (await canLaunchUrl(Uri.parse(url))) {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  } else {
    // Fallback: Open in app map viewer
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapDirectionScreen(
          destinationLat: lat,
          destinationLng: lng,
          doctorName: visit.doctor,
        ),
      ),
    );
  }
}
```

**Or use Google Maps Flutter plugin**:

```dart
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MapDirectionScreen extends StatelessWidget {
  final double destinationLat;
  final double destinationLng;
  final String doctorName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Direction to $doctorName')),
      body: GoogleMap(
        initialCameraPosition: CameraPosition(
          target: LatLng(destinationLat, destinationLng),
          zoom: 15,
        ),
        markers: {
          Marker(
            markerId: MarkerId('doctor'),
            position: LatLng(destinationLat, destinationLng),
            infoWindow: InfoWindow(title: doctorName),
          ),
        },
        myLocationEnabled: true,
        myLocationButtonEnabled: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final url = 'https://www.google.com/maps/dir/?api=1&destination=$destinationLat,$destinationLng';
          await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        },
        label: Text('Open in Google Maps'),
        icon: Icon(Icons.directions),
      ),
    );
  }
}
```

---

## Complete Flow Summary

```
1. User opens Racer app
   ↓
2. Taps "Add Visit" button
   ↓
3. Fills form:
   - Selects doctor (from dropdown)
   - Selects date
   - Selects transport mode
   - Saves
   ↓
4. Visit appears in "Planned" tab
   ↓
5. User taps "Get Direction"
   → Opens Google Maps with route
   ↓
6. User arrives at doctor location
   ↓
7. User taps on visit → Opens detail screen
   ↓
8. User fills:
   - Takes pictures
   - Adds remarks
   - Adds extra info
   ↓
9. User taps "I AM HERE"
   → Visit status changes to "open"
   → Check-in API called with location
   ↓
10. "Show Presentation" button appears
    ↓
11. User taps "Show Presentation"
    → Fetches presentations
    → Opens PDF/PPT viewer
    → Marks as shown
    ↓
12. User taps "CLOSE VISIT"
    ↓
13. Dialog: "Did you meet the doctor?"
    ↓
14a. If NO:
     → Show reason dialog
     → Submit with reason
     → Visit marked as "skipped"
     → Done!
     ↓
14b. If YES:
     → Navigate to Products Promoted screen
     ↓
15. Products Promoted Screen:
    - Shows all products
    - User toggles "Is Prescribing"
    - User checks "Top 5"
    - User taps "NEXT"
    ↓
16. Samples Given Screen:
    - Shows all products
    - User enters quantities
    - User taps "SUBMIT"
    ↓
17. API call to close visit with:
    - metDoctor = true
    - productsPromoted array
    - samplesGiven array
    ↓
18. Visit marked as "closed"
    ↓
19. User returns to visits list
    ↓
20. Admin can see visit in dashboard with all details!
```

---

## Admin Dashboard View

The admin will see:

### Visit Details
- Doctor visited
- Employee name
- Check-in time, Check-out time
- Location (map pin)
- Photos taken
- Remarks and extra info
- Presentation shown (Yes/No)

### Products Promoted
Table showing:
| Product Name | Is Prescribing | Top 5 |
|--------------|----------------|-------|
| BACTOMUST 5GM | ✓ | - |
| DUOTWIST LD | - | ✓ |

### Samples Given
Table showing:
| Product Name | Quantity |
|--------------|----------|
| BACTOMUST 5GM | 5 |

### Analytics
- Total visits per employee
- Most promoted products
- Samples distribution
- Doctor coverage
- Visit success rate

---

## Testing Checklist

- [ ] Create planned visit
- [ ] View in planned tab
- [ ] Get directions works
- [ ] Check-in updates location
- [ ] Take picture saves photo
- [ ] Update remarks works
- [ ] Show presentation opens viewer
- [ ] Close visit - NOT met with reason
- [ ] Close visit - MET with products
- [ ] Products promoted toggles work
- [ ] Samples given quantities save
- [ ] Submit closes visit successfully
- [ ] Admin sees all visit data

---

## Next Steps

1. Install required Flutter packages
2. Create the 7 new screens
3. Update visits_screen.dart with tabs
4. Test the complete flow
5. Deploy to production

All APIs are ready and working! Just implement the mobile UI and you're done! 🚀
