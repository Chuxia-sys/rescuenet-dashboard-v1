import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

interface DirectionsMapProps {
  destination: { lat: number; lng: number }
  destinationName?: string
}

export default function DirectionsMap({ destination, destinationName }: DirectionsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const routingControlRef = useRef<any>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const directionsPanelRef = useRef<HTMLDivElement>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const phBounds: L.LatLngBoundsExpression = [
    [4.0, 116.0],
    [21.5, 127.0],
  ]

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [12.8797, 121.7740],
      zoom: 12,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: phBounds,
      maxBoundsViscosity: 1.0,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Request and continuously track user location (GPS-like)
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const userPos = { lat: latitude, lng: longitude }
        setUserLocation(userPos)
        setLoading(false)
      },
      (error) => {
        let message = 'Unable to get your location'
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable location access in your browser.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.'
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.'
        }
        setLocationError(message)
        setLoading(false)
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Update map with user location and routing
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return
    if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) {
      setRouteError('Destination coordinates are missing or invalid.')
      return
    }

    // Remove old user marker
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current)
    }

    // Add user location marker
    const userIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('Your Location')
    userMarkerRef.current = userMarker

    // Add destination marker
    const destIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(destinationName || 'Destination')

    // Add or update routing
    if (routingControlRef.current) {
      routingControlRef.current.setWaypoints([
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(destination.lat, destination.lng),
      ])
      routingControlRef.current.route()
    } else {
      const routingControl = (L as any).Routing.control({
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
        }),
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(destination.lat, destination.lng),
        ],
        routeWhileDragging: false,
        show: true,
        fitSelectedRoutes: false,
        collapsible: false,
        lineOptions: {
          styles: [{ color: '#3b82f6', opacity: 0.9, weight: 6 }],
        },
        altLineOptions: {
          styles: [{ color: '#999', opacity: 0.4, weight: 3 }],
        },
        language: 'en',
      }).addTo(mapInstanceRef.current)

      routingControlRef.current = routingControl

      if (directionsPanelRef.current) {
        routingControl.on('routeselected', () => {
          routingControl.getContainer()?.remove()
          directionsPanelRef.current?.appendChild(routingControl.getContainer())
        })
        routingControl.getContainer()?.remove()
        directionsPanelRef.current.appendChild(routingControl.getContainer())
      }

      routingControl.on('routesfound', () => {
        setRouteError(null)
      })

      routingControl.on('routingerror', () => {
        setRouteError('Unable to calculate route. Please check your internet connection or try again.')
      })
    }

    // GPS-like follow: keep map centered on user
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: true })
    // Fix small/grey map issue after mount or view switch
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 50)
  }, [userLocation, destination, destinationName])

  // Invalidate size when loading completes (map becomes visible)
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 50)
    }
  }, [loading])

  return (
    <div className="h-full w-full flex flex-col lg:flex-row">
      {loading && (
        <div className="flex items-center justify-center h-full bg-muted/50">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-muted-foreground">Getting your location...</p>
          </div>
        </div>
      )}
      {locationError && (
        <div className="flex items-center justify-center h-full bg-destructive/10">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm shadow-lg">
            <h3 className="font-semibold text-lg text-foreground mb-2">Location Access Required</h3>
            <p className="text-muted-foreground mb-4">{locationError}</p>
            <p className="text-sm text-muted-foreground">
              Please enable location access in your browser settings to see directions.
            </p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="h-[500px] lg:h-full w-full lg:w-3/4"
        style={{ display: locationError || loading ? 'none' : 'block' }}
      />
      <div
        className="lg:w-1/4 w-full border-l border-border bg-background"
        style={{ display: locationError || loading ? 'none' : 'block' }}
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Directions</h3>
          <p className="text-xs text-muted-foreground mt-1">
            From your location to {destinationName || 'destination'}
          </p>
          {routeError && (
            <p className="text-xs text-red-500 mt-2">{routeError}</p>
          )}
        </div>
        <div ref={directionsPanelRef} className="p-3 text-sm max-h-[500px] lg:max-h-none overflow-auto" />
      </div>
    </div>
  )
}
