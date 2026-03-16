import { useState, useEffect } from 'react'
import { blink } from '@/lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MapPin, Layers, AlertTriangle, Home, Radio, Filter, Clock, Plus, Navigation, Map as MapIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import LeafletMap from '@/components/map/LeafletMap'
import DirectionsMap from '@/components/map/DirectionsMap'

interface Disaster {
  id: string
  type: string
  location: string
  description: string
  status: string
  latitude?: number
  longitude?: number
  createdAt: string
}

interface EvacuationCenter {
  id: string
  name: string
  address: string
  capacity: number
  currentEvacuees: number
  status: string
  latitude?: number
  longitude?: number
}

interface MapMarker {
  id: string
  lat: number
  lng: number
  type: 'disaster' | 'evacuation' | 'rescue'
  title: string
  description?: string
  status?: string
  emoji?: string
}

// Disaster emoji mapping
const disasterEmojis: Record<string, string> = {
  flood: '🌊',
  fire: '🔥',
  landslide: '⛰️',
  earthquake: '🌍',
  typhoon: '🌀',
  other: '⚠️',
}

export default function MapPage() {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null)
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [directionDestination, setDirectionDestination] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [activeLayers, setActiveLayers] = useState({
    disasters: true,
    evacuation: true,
    rescue: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('evacuation_center_focus')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.id) {
        setFocusMarkerId(parsed.id)
        setActiveLayers(prev => ({ ...prev, evacuation: true }))
      }

      if (parsed?.latitude && parsed?.longitude) {
        const lat = Number(parsed.latitude)
        const lng = Number(parsed.longitude)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setFocusCoords({ lat, lng })
          setDirectionDestination({
            lat,
            lng,
            name: parsed?.name || 'Evacuation Center',
          })
          setShowDirections(true)
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      window.localStorage.removeItem('evacuation_center_focus')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('evacuation_center_coords')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.lat && parsed?.lng) {
        const lat = Number(parsed.lat)
        const lng = Number(parsed.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setFocusCoords({ lat, lng })
          setDirectionDestination({
            lat,
            lng,
            name: 'Evacuation Center',
          })
          setShowDirections(true)
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      window.localStorage.removeItem('evacuation_center_coords')
    }
  }, [])

  const loadData = async () => {
    try {
      const [disasterData, centerData] = await Promise.all([
        blink.db.disasters.list({ orderBy: { createdAt: 'desc' }, limit: 50 }),
        blink.db.evacuation_centers.list({ limit: 50 }),
      ])
      setDisasters(disasterData as Disaster[])
      setEvacuationCenters(centerData as EvacuationCenter[])
    } catch (error) {
      console.error('Error loading map data:', error)
      // Use mock data if needed
    } finally {
      setLoading(false)
    }
  }

  // Convert data to markers
  const mapMarkers: MapMarker[] = [
    // Disaster markers
    ...disasters.map(d => ({
      id: d.id,
      lat: d.latitude || (8 + Math.random() * 10), // Within PH Lat
      lng: d.longitude || (118 + Math.random() * 6), // Within PH Lng
      type: 'disaster' as const,
      title: `${d.type} - ${d.location}`,
      description: d.description,
      status: d.status,
      emoji: disasterEmojis[d.type.toLowerCase()] || '⚠️',
    })),
    // Evacuation center markers
    ...evacuationCenters.map(c => ({
      id: c.id,
      lat: c.latitude || (8 + Math.random() * 10), // Within PH Lat
      lng: c.longitude || (118 + Math.random() * 6), // Within PH Lng
      type: 'evacuation' as const,
      title: c.name,
      description: `${c.currentEvacuees}/${c.capacity} evacuees`,
      status: c.status,
      emoji: '🏠',
    })),
    // Mock rescue markers
    { id: 'r1', lat: 14.5995, lng: 120.9842, type: 'rescue', title: 'Family stranded', description: 'Manila - Flood emergency', status: 'pending', emoji: '🚨' },
    { id: 'r2', lat: 10.3098, lng: 123.8930, type: 'rescue', title: 'Trapped residents', description: 'Cebu - Building collapse', status: 'in-progress', emoji: '🚨' },
    { id: 'r3', lat: 7.1907, lng: 125.4553, type: 'rescue', title: 'Medical emergency', description: 'Davao - Urgent medical needed', status: 'pending', emoji: '🚨' },
  ]

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker)
    // If evacuation center, offer directions
    if (marker.type === 'evacuation') {
      setDirectionDestination({
        lat: marker.lat,
        lng: marker.lng,
        name: marker.title,
      })
    }
  }

  const startNavigation = (lat: number, lng: number, name: string) => {
    setDirectionDestination({ lat, lng, name })
    setShowDirections(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">
            {showDirections ? 'Navigation' : 'Interactive Map'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showDirections
              ? 'Follow turn-by-turn directions to your destination'
              : 'View disaster locations and evacuation centers in real-time'}
          </p>
        </div>
        <div className="flex gap-2">
          {showDirections && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDirections(false)}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Back to Map
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveLayers({ disasters: true, evacuation: true, rescue: true })}
          >
            <Layers className="h-4 w-4 mr-2" />
            Show All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveLayers({ disasters: false, evacuation: false, rescue: false })}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <Card className="elevation-1 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px] lg:h-[600px]">
            {showDirections && directionDestination ? (
              <DirectionsMap
                destination={{ lat: directionDestination.lat, lng: directionDestination.lng }}
                destinationName={directionDestination.name}
              />
            ) : (
              <LeafletMap
                markers={mapMarkers}
                activeLayers={activeLayers}
                focusMarkerId={focusMarkerId}
                focusCoords={focusCoords}
                onMarkerClick={handleMarkerClick}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layer Controls */}
      <Card className="elevation-1 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-heading">Map Layers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => toggleLayer('disasters')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200',
                activeLayers.disasters
                  ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20'
                  : 'bg-muted/50 border-border hover:bg-muted'
              )}
            >
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">
                Disasters ({disasters.length})
              </span>
            </button>
            
            <button
              onClick={() => toggleLayer('evacuation')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200',
                activeLayers.evacuation
                  ? 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20'
                  : 'bg-muted/50 border-border hover:bg-muted'
              )}
            >
              <Home className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-foreground">
                Centers ({evacuationCenters.length})
              </span>
            </button>
            
            <button
              onClick={() => toggleLayer('rescue')}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200',
                activeLayers.rescue
                  ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20'
                  : 'bg-muted/50 border-border hover:bg-muted'
              )}
            >
              <Radio className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-foreground">
                Rescue (3)
              </span>
            </button>

            <button
              onClick={() => setActiveLayers({ disasters: true, evacuation: true, rescue: true })}
              className="flex items-center gap-3 p-3 rounded-lg border-2 bg-primary/10 border-primary/50 hover:bg-primary/20 transition-all duration-200"
            >
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                All Layers
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disasters</p>
                <p className="text-xl font-bold text-foreground">{disasters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Centers</p>
                <p className="text-xl font-bold text-foreground">
                  {evacuationCenters.filter(c => c.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rescue Requests</p>
                <p className="text-xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-bold text-foreground">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marker Detail Dialog */}
      <Dialog open={!!selectedMarker} onOpenChange={() => setSelectedMarker(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Location Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected location
            </DialogDescription>
          </DialogHeader>
          {selectedMarker && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  selectedMarker.type === 'disaster' && 'bg-red-500',
                  selectedMarker.type === 'evacuation' && 'bg-green-500',
                  selectedMarker.type === 'rescue' && 'bg-amber-500',
                  'text-white'
                )}>
                  {selectedMarker.type}
                </Badge>
                {selectedMarker.status && (
                  <span className="text-sm text-muted-foreground capitalize">{selectedMarker.status}</span>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">{selectedMarker.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedMarker.description}</p>
              </div>

              <div className="flex gap-2">
                {selectedMarker.type === 'evacuation' && (
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      startNavigation(selectedMarker.lat, selectedMarker.lng, selectedMarker.title)
                      setSelectedMarker(null)
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                )}
                <Button variant="outline" className={selectedMarker.type !== 'evacuation' ? 'flex-1' : ''}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
