import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Home, MapPin, Users, Navigation, Phone, Clock } from 'lucide-react'

interface EvacuationCenter {
  id: string
  name: string
  address: string
  capacity: number
  currentEvacuees: number
  status: 'open' | 'full' | 'closed'
  distance?: number
  contactNumber?: string
  lastUpdated: string
}

const mockCenters: EvacuationCenter[] = [
  {
    id: '1',
    name: 'Central Elementary School',
    address: '123 Main Street, Barangay San Jose',
    capacity: 500,
    currentEvacuees: 320,
    status: 'open',
    distance: 2.3,
    contactNumber: '+63 912 345 6789',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Municipal Gymnasium',
    address: '456 Rizal Avenue, Town Center',
    capacity: 800,
    currentEvacuees: 780,
    status: 'full',
    distance: 4.1,
    contactNumber: '+63 917 123 4567',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Parish Church Hall',
    address: '789 Church Road, Poblacion',
    capacity: 200,
    currentEvacuees: 150,
    status: 'open',
    distance: 1.5,
    contactNumber: '+63 918 987 6543',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Community Center',
    address: '321 Community Drive, Sitio Maligaya',
    capacity: 350,
    currentEvacuees: 0,
    status: 'open',
    distance: 5.7,
    contactNumber: '+63 915 555 1234',
    lastUpdated: new Date().toISOString(),
  },
]

export default function EvacuationCentersPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCenters(mockCenters)
      setLoading(false)
    }, 500)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500 text-white'
      case 'full':
        return 'bg-red-500 text-white'
      case 'closed':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Evacuation Centers</h1>
          <p className="text-muted-foreground mt-1">
            Find open evacuation centers near you
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Open</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Full</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {centers.filter((c) => c.status === 'open').length}
                </p>
                <p className="text-sm text-muted-foreground">Open Centers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {centers.filter((c) => c.status === 'full').length}
                </p>
                <p className="text-sm text-muted-foreground">Full Centers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {centers.reduce((acc, c) => acc + c.currentEvacuees, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Evacuees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {centers.reduce((acc, c) => acc + c.capacity, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="elevation-1 border-border/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          centers.map((center) => {
            const capacityPercentage = Math.round((center.currentEvacuees / center.capacity) * 100)
            return (
              <Card key={center.id} className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{center.name}</h3>
                      <Badge className={`${getStatusColor(center.status)} text-xs mt-1`}>
                        {center.status}
                      </Badge>
                    </div>
                    {center.distance && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{center.distance} km</p>
                        <p className="text-xs text-muted-foreground">away</p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{center.address}</p>
                  </div>

                  {/* Capacity Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium text-foreground">
                        {center.currentEvacuees} / {center.capacity}
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${getCapacityColor(capacityPercentage)} transition-all duration-300`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {capacityPercentage.toFixed(0)}% occupied
                    </p>
                  </div>

                  {/* Contact */}
                  {center.contactNumber && (
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{center.contactNumber}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button variant="outline">Call</Button>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Updated {new Date(center.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}