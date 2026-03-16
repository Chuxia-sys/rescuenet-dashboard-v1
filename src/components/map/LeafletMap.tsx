import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Marker {
  id: string
  lat: number
  lng: number
  type: 'disaster' | 'evacuation' | 'rescue'
  title: string
  description?: string
  status?: string
  emoji?: string
}

interface LeafletMapProps {
  markers: Marker[]
  activeLayers: {
    disasters: boolean
    evacuation: boolean
    rescue: boolean
  }
  focusMarkerId?: string | null
  focusCoords?: { lat: number; lng: number } | null
  onMarkerClick?: (marker: Marker) => void
}

// Fix Leaflet default icon issue
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

export default function LeafletMap({ markers, activeLayers, focusMarkerId, focusCoords, onMarkerClick }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const focusedMarkerRef = useRef<string | null>(null)

  // Define Philippines bounds
  const phBounds: L.LatLngBoundsExpression = [
    [4.0, 116.0], // Southwest
    [21.5, 127.0] // Northeast
  ]

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map centered on Philippines with restricted bounds
    const map = L.map(mapRef.current, {
      center: [12.8797, 121.7740],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: phBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    // Create layer group for markers
    markersLayerRef.current = L.layerGroup().addTo(map)
    
    mapInstanceRef.current = map

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    // Clear existing markers
    markersLayerRef.current.clearLayers()

    // Filter markers by active layers
    const activeMarkers = markers.filter(marker => {
      if (marker.type === 'disaster' && !activeLayers.disasters) return false
      if (marker.type === 'evacuation' && !activeLayers.evacuation) return false
      if (marker.type === 'rescue' && !activeLayers.rescue) return false
      return true
    })

    // Add markers to map
    activeMarkers.forEach(marker => {
      let markerColor = '#6b7280' // gray for unknown
      
      if (marker.type === 'disaster') {
        markerColor = '#ef4444' // red
      } else if (marker.type === 'evacuation') {
        markerColor = marker.status === 'full' ? '#ef4444' : '#22c55e'
      } else if (marker.type === 'rescue') {
        markerColor = '#f59e0b' // amber
      }

      // Create custom icon
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 32px;
            height: 32px;
            border-radius: ${marker.type === 'evacuation' ? '6px' : '50%'};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${marker.emoji || ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      })

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon })
        .addTo(markersLayerRef.current!)

      // Add popup
      leafletMarker.bindPopup(`
        <div style="min-width: 180px; padding: 8px;">
          <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
            ${marker.title}
          </h3>
          ${marker.status ? `
            <span style="
              display: inline-block;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 500;
              background: ${markerColor};
              color: white;
              margin-bottom: 8px;
            ">
              ${marker.status}
            </span>
          ` : ''}
          ${marker.description ? `
            <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
              ${marker.description}
            </p>
          ` : ''}
        </div>
      `)

      // Add click handler
      leafletMarker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(marker)
        }
      })

      if (focusMarkerId && marker.id === focusMarkerId && focusedMarkerRef.current !== marker.id) {
        focusedMarkerRef.current = marker.id
        mapInstanceRef.current?.setView([marker.lat, marker.lng], 14, { animate: true })
        leafletMarker.openPopup()
      }

      if (focusCoords && focusCoords.lat && focusCoords.lng) {
        mapInstanceRef.current?.setView([focusCoords.lat, focusCoords.lng], 16, { animate: true })
      }
    })
  }, [markers, activeLayers, focusMarkerId, focusCoords, onMarkerClick])

  return (
    <div 
      ref={mapRef} 
      className="h-full w-full"
      style={{ minHeight: '500px' }}
    />
  )
}