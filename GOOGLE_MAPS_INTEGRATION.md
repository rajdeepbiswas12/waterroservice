# Google Maps Integration & Order Tracking

## Overview
The RO Service application now includes Google Maps API integration for smart address entry and real-time order tracking functionality.

## New Features

### 1. Google Places Address Autocomplete
- **Smart Address Entry**: Type-ahead address suggestions powered by Google Places API
- **Auto-Complete Fields**: Automatically fills latitude, longitude, city, state, and postal code
- **Location Accuracy**: Ensures precise service location coordinates
- **Usage**: Available in Create Order and Edit Order forms

### 2. Interactive Map Display
- **Visual Location**: See service locations on an interactive Google Map
- **Map Features**: 
  - Zoom controls
  - Street view
  - Satellite/Terrain view options
  - Info windows with address details
- **Actions**:
  - Get Directions (opens Google Maps for navigation)
  - Copy Location (copies coordinates to clipboard)

### 3. Public Order Tracking
- **Customer Access**: Share tracking links with customers for real-time order status
- **No Login Required**: Public tracking page accessible without authentication
- **Features**:
  - Order progress timeline
  - Current status with visual indicators
  - Service location map
  - Technician information
  - Order history with timestamps
  - Auto-refresh every 30 seconds

### 4. Tracking Link Sharing
- **Quick Share**: One-click copy of tracking URL from orders list
- **Format**: `https://your-domain.com/track-order/{orderId}`
- **Use Case**: Send to customers via SMS, email, or WhatsApp

## Setup Instructions

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API Key)
5. Restrict API key (recommended):
   - Application restrictions: HTTP referrers
   - Add your domain (e.g., `your-domain.com/*`)
   - API restrictions: Select Maps JavaScript API and Places API

### 2. Configure API Key

**Frontend Configuration:**
Update `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE'  // Replace this
};
```

**index.html:**
The Google Maps script is already included in `frontend/src/index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places" async defer></script>
```
You can replace the key there or it will use the environment variable.

### 3. Database Migration
The Order table now includes additional fields:
- `city` (VARCHAR 100)
- `state` (VARCHAR 100)
- `postalCode` (VARCHAR 20)

**Run migration** (if using migrations):
```bash
cd backend
npm run migrate  # If you have migrations set up
```

Or **manually add columns**:
```sql
ALTER TABLE orders 
ADD COLUMN city VARCHAR(100) AFTER customerAddress,
ADD COLUMN state VARCHAR(100) AFTER city,
ADD COLUMN postalCode VARCHAR(20) AFTER state;
```

## Usage Guide

### For Admins

#### Creating Orders with Address Autocomplete:
1. Go to **Orders** → **Create Order**
2. In the "Service Address" field, start typing the address
3. Select from autocomplete suggestions
4. Location fields (coordinates, city, state) auto-populate
5. Save the order

#### Viewing Order Location:
1. Open any order detail page
2. Scroll to "Service Location" section
3. View map with marker
4. Click "Get Directions" for navigation
5. Click "Copy Location" for coordinates

#### Sharing Tracking Link:
1. Go to **Orders List**
2. Find the order
3. Click the share icon (📤)
4. Link copied to clipboard
5. Share with customer via SMS/Email/WhatsApp

### For Customers

#### Tracking Orders:
1. Receive tracking link from service provider
2. Open link in any browser (no login needed)
3. View:
   - Current order status
   - Progress percentage
   - Service location on map
   - Technician details
   - Complete timeline of updates
4. Page auto-refreshes every 30 seconds

## Components Created

### 1. AddressAutocompleteComponent
**Location**: `frontend/src/app/components/shared/address-autocomplete/`

**Purpose**: Reusable Google Places autocomplete input

**Usage**:
```html
<app-address-autocomplete 
  label="Service Address" 
  placeholder="Start typing address..."
  [initialValue]="currentAddress"
  (addressSelected)="onAddressSelected($event)">
</app-address-autocomplete>
```

**Output Event**:
```typescript
{
  address: string,
  latitude: number,
  longitude: number,
  city: string,
  state: string,
  country: string,
  postalCode: string
}
```

### 2. GoogleMapComponent
**Location**: `frontend/src/app/components/shared/google-map/`

**Purpose**: Display location on interactive map

**Usage**:
```html
<app-google-map 
  [latitude]="order.latitude" 
  [longitude]="order.longitude"
  [address]="order.customerAddress"
  [zoom]="15">
</app-google-map>
```

### 3. TrackOrderComponent
**Location**: `frontend/src/app/components/shared/track-order/`

**Purpose**: Public order tracking page

**Route**: `/track-order/:id`

**Features**:
- No authentication required
- Progress bar with percentage
- Visual status timeline
- Interactive map
- Order history
- Auto-refresh functionality

## API Endpoints (No Changes Required)

All tracking functionality uses existing order endpoints:
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/:id` - Includes history and assigned employee

No new backend endpoints needed!

## Cost Considerations

Google Maps API pricing:
- **Maps JavaScript API**: $7 per 1,000 map loads
- **Places API**: $17 per 1,000 requests (autocomplete)
- **Free tier**: $200 credit/month (≈28,000 map loads)

**Recommendations**:
1. Set up billing alerts in Google Cloud Console
2. Implement API key restrictions
3. Enable caching where possible
4. Monitor usage regularly

## Security Best Practices

1. **API Key Restrictions**:
   - HTTP referrer restrictions
   - API restrictions (only Maps & Places)
   - Rate limiting

2. **Environment Variables**:
   - Never commit real API keys to Git
   - Use environment-specific keys
   - Production keys separate from dev

3. **Public Tracking**:
   - No sensitive data exposed
   - Order ID validation
   - Rate limiting on backend

## Troubleshooting

### Map Not Loading
- Check API key is valid
- Verify Maps JavaScript API is enabled
- Check browser console for errors
- Ensure domains are whitelisted

### Autocomplete Not Working
- Verify Places API is enabled
- Check API key restrictions
- Confirm billing is enabled on Google Cloud
- Check network tab for API errors

### Tracking Link Not Working
- Verify route is registered in `app.routes.ts`
- Check order ID is valid
- Ensure backend is running
- Check CORS settings

## Testing

### Test Address Autocomplete:
1. Create new order
2. Type "123 Main Street, San Francisco"
3. Select from suggestions
4. Verify all fields populate

### Test Map Display:
1. View order with coordinates
2. Check map loads with marker
3. Test zoom controls
4. Test info window click

### Test Tracking Page:
1. Create order (ID: 1)
2. Visit `http://localhost:4200/track-order/1`
3. Verify all sections display
4. Update order status
5. Refresh - confirm updates appear

## Future Enhancements

Potential additions:
- **Real-time tracking**: Employee location tracking
- **Route optimization**: Best path for multiple orders
- **Geofencing**: Automatic check-in when technician arrives
- **Distance calculation**: Travel time estimates
- **Heat maps**: Service request density visualization
- **SMS notifications**: Auto-send tracking links
- **QR codes**: Quick tracking access

## Support

For issues or questions:
- Check Google Maps Platform Status
- Review API quota and billing
- Check browser compatibility
- Contact support team

---

**Last Updated**: January 2026  
**Version**: 2.0  
**Author**: RO Service Team
