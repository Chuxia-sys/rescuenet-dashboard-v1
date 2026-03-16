# Live Navigation Feature

## Overview
The live navigation feature converts the map from a static marker visualization into an interactive turn-by-turn directions system. When users click "Get Directions" on any evacuation center, they're taken to a navigation view that shows:

1. **User Location** - A blue marker showing the user's current GPS position
2. **Destination Marker** - A red marker showing the evacuation center
3. **Turn-by-Turn Directions** - A route line with detailed navigation instructions
4. **Real-time Updates** - The map updates as the user moves

## How It Works

### 1. Geolocation Permission
When a user clicks "Get Directions" and enters the navigation view:
- The browser requests permission to access their GPS location
- A loading spinner shows while fetching location
- If permission is denied, an error message explains how to enable location access in browser settings

### 2. Route Calculation
Once user location is obtained:
- Leaflet Routing Machine calculates the optimal route using OpenStreetMap's OSRM service
- The route is drawn as a blue line on the map
- Distance and estimated travel time are displayed in the routing control panel

### 3. Navigation View
The map automatically:
- Fits to show both the user and destination with padding
- Centers on the route for optimal viewing
- Displays turn-by-turn instructions in a sidebar (via Leaflet Routing Machine)
- Shows alternative routes if available

## Components

### DirectionsMap Component
Location: `src/components/map/DirectionsMap.tsx`

**Props:**
- `destination`: `{ lat: number; lng: number }` - The destination coordinates
- `destinationName?`: `string` - Optional name to display on the destination marker

**Features:**
- Requests geolocation on mount
- Handles location permission errors gracefully
- Integrates leaflet-routing-machine for routing
- Uses colored markers (blue for user, red for destination)
- Displays loading state while fetching location

### MapPage Integration
Location: `src/pages/MapPage.tsx`

**New State:**
- `showDirections` - Toggle between map and navigation view
- `directionDestination` - Current navigation destination with coordinates

**Key Handlers:**
- `handleMarkerClick()` - Stores destination when evacuation center marker clicked
- `startNavigation()` - Activates directions view with destination
- Back to Map button - Returns to regular map view

## User Flow

1. User navigates to Map page
2. Views disasters and evacuation centers on interactive map
3. Clicks on an evacuation center marker
4. Dialog shows "Get Directions" button
5. Clicks "Get Directions"
6. Browser requests location permission (user sees prompt)
7. User grants permission or enables location in settings
8. Map switches to DirectionsMap showing:
   - Blue dot at user's location
   - Red marker at evacuation center
   - Blue route line between them
   - Turn-by-turn instructions
9. User follows directions to evacuation center
10. Can click "Back to Map" to return to regular map view

## Technical Details

### Dependencies
- **leaflet-routing-machine** (v3.2.12) - Calculates and displays routes
- **leaflet** (v1.9.4) - Base mapping library
- **Geolocation API** - Browser API for GPS location

### Routing Service
- Uses OpenStreetMap's OSRM (Open Route Service Manager)
- Service type: 'osrmcar' for driving directions
- Automatically handles routing calculations
- Shows distance in kilometers and time in minutes

### Marker Styling
- **Blue marker** - User's current location
- **Red marker** - Destination (evacuation center)
- **Shadow** - Standard Leaflet shadow for depth

### Error Handling
- Permission Denied → User-friendly message with instructions
- Location Unavailable → Clear error message
- Timeout → Informs user request took too long
- Network → Graceful fallback (shows loading state)

## Browser Support

This feature requires:
- Modern browser with Geolocation API support
- HTTPS connection (required for geolocation in most browsers, except localhost)
- Location permission granted

Works on:
- Chrome/Edge
- Firefox
- Safari (iOS 13+)
- Mobile browsers (recommended for navigation use)

## Future Enhancements

Possible improvements:
1. **Live Position Tracking** - Use `watchPosition()` instead of `getCurrentPosition()` to continuously update user location
2. **Real-time Backend Sync** - Send user coordinates to Blink for team coordination
3. **Offline Routes** - Cache maps and routes for offline navigation
4. **Alternative Routes** - Show multiple route options and let user select
5. **Voice Guidance** - Add text-to-speech for turn-by-turn instructions
6. **Route Sharing** - Share route coordinates with other volunteers
