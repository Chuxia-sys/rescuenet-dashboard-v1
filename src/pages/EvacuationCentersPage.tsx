import { useState, useEffect } from 'react'
import { blink } from '@/lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Home, MapPin, Users, Navigation, Phone, Clock, Plus, MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'

interface EvacuationCenter {
  id: string
  name: string
  address: string
  capacity: number
  currentEvacuees: number
  status: 'open' | 'full' | 'closed'
  contactNumber?: string
  latitude?: number
  longitude?: number
  lastUpdated: string
}

interface EvacuationCentersPageProps {
  onNavigate?: (page: string) => void
}

export default function EvacuationCentersPage({ onNavigate }: EvacuationCentersPageProps) {
  const [centers, setCenters] = useState<EvacuationCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const localStorageKey = 'evacuation_centers_local'
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: 0,
    contactNumber: '',
    latitude: '',
    longitude: '',
  })

  useEffect(() => {
    loadCenters()
  }, [])

  const loadLocalCenters = () => {
    if (typeof window === 'undefined') return [] as EvacuationCenter[]
    try {
      const raw = window.localStorage.getItem(localStorageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as EvacuationCenter[]) : []
    } catch {
      return []
    }
  }

  const saveLocalCenters = (items: EvacuationCenter[]) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }

  const geocodeAddress = async (address: string) => {
    const query = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to geocode address')
    }

    const results = await response.json()
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('No coordinates found for address')
    }

    const first = results[0]
    const latitude = Number(first.lat)
    const longitude = Number(first.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Invalid coordinates returned')
    }

    return { latitude, longitude }
  }

  const loadCenters = async () => {
    try {
      const data = await blink.db.evacuation_centers.list({
        orderBy: { createdAt: 'desc' },
      })
      const remoteCenters = data as EvacuationCenter[]
      const localCenters = loadLocalCenters()
      const merged = [
        ...remoteCenters,
        ...localCenters.filter((local) => !remoteCenters.some((remote) => remote.id === local.id)),
      ]
      setCenters(merged)
    } catch (error) {
      console.error('Error loading centers:', error)
      const localCenters = loadLocalCenters()
      if (localCenters.length > 0) {
        setCenters(localCenters)
      } else {
        // Use mock data if DB not available
        setCenters([
          {
            id: '1',
            name: 'Central Elementary School',
            address: '123 Main Street, Barangay San Jose',
            capacity: 500,
            currentEvacuees: 320,
            status: 'open',
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
            contactNumber: '+63 915 555 1234',
            lastUpdated: new Date().toISOString(),
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const updateCenterStatus = async (id: string, status: EvacuationCenter['status']) => {
    try {
      await blink.db.evacuation_centers.update(id, { status, lastUpdated: new Date().toISOString() })
      setCenters(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      toast.success(`Center status updated to ${status}`)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const deleteCenter = async (id: string) => {
    try {
      if (confirm('Are you sure you want to remove this evacuation center?')) {
        await blink.db.evacuation_centers.delete(id)
        setCenters(prev => prev.filter(c => c.id !== id))
        toast.success('Center removed')
      }
    } catch (error) {
      toast.error('Failed to remove center')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const capacity = Number(formData.capacity)

    try {
      const user = await blink.auth.me()
      if (!user) {
        toast.error('Please sign in to add evacuation centers')
        return
      }

      if (!Number.isFinite(capacity) || capacity <= 0) {
        toast.error('Capacity must be greater than 0')
        return
      }

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        capacity,
        currentEvacuees: 0,
        status: 'open',
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }

      if (formData.contactNumber.trim()) {
        payload.contactNumber = formData.contactNumber.trim()
      }

      const latitude = Number(formData.latitude)
      const longitude = Number(formData.longitude)
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        payload.latitude = latitude
        payload.longitude = longitude
      }

      let createdCenter: unknown
      try {
        createdCenter = await blink.db.evacuation_centers.create(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message.includes('400')) {
          const minimalPayload: Record<string, unknown> = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            capacity,
            currentEvacuees: 0,
            status: 'open',
          }

          if (formData.contactNumber.trim()) {
            minimalPayload.contactNumber = formData.contactNumber.trim()
          }

          createdCenter = await blink.db.evacuation_centers.create(minimalPayload)
        } else {
          throw error
        }
      }

      setCenters(prev => {
        const next = [createdCenter as EvacuationCenter, ...prev]
        saveLocalCenters(next)
        return next
      })
      toast.success('Evacuation center added successfully!')
      setFormData({ name: '', address: '', capacity: 0, contactNumber: '' })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating center:', error)
      const localCenter: EvacuationCenter = {
        id: `local-${Date.now()}`,
        name: formData.name.trim(),
        address: formData.address.trim(),
        capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 0,
        currentEvacuees: 0,
        status: 'open',
        contactNumber: formData.contactNumber.trim() || undefined,
        latitude: Number.isFinite(Number(formData.latitude)) ? Number(formData.latitude) : undefined,
        longitude: Number.isFinite(Number(formData.longitude)) ? Number(formData.longitude) : undefined,
        lastUpdated: new Date().toISOString(),
      }

      setCenters(prev => {
        const next = [localCenter, ...prev]
        saveLocalCenters(next)
        return next
      })

      toast.success('Evacuation center added locally (offline mode)')
      setFormData({ name: '', address: '', capacity: 0, contactNumber: '', latitude: '', longitude: '' })
      setIsDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500 text-white'
      case 'full':
        return 'bg-red-500 text-white'
      case 'closed':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-500 text-white'
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
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Center
        </Button>
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="elevation-1 border-border/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : centers.length === 0 ? (
        <Card className="elevation-1 border-border/50">
          <CardContent className="py-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No evacuation centers found</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Center
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {centers.map((center) => {
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
                    <div className="flex items-center gap-2">
                      {center.status === 'open' && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {center.currentEvacuees} / {center.capacity}
                          </p>
                          <p className="text-xs text-muted-foreground">evacuees</p>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateCenterStatus(center.id, 'open')}>
                            Set as Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateCenterStatus(center.id, 'full')}>
                            Set as Full
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateCenterStatus(center.id, 'closed')}>
                            Set as Closed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteCenter(center.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Center
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={async () => {
                        let latitude = center.latitude ?? null
                        let longitude = center.longitude ?? null

                        if (latitude === null || longitude === null) {
                          try {
                            const queryAddress = center.address?.trim()
                              ? center.address
                              : `${center.name}`
                            const coords = await geocodeAddress(queryAddress)
                            latitude = coords.latitude
                            longitude = coords.longitude

                            setCenters(prev => {
                              const next = prev.map(item =>
                                item.id === center.id
                                  ? { ...item, latitude, longitude }
                                  : item
                              )
                              saveLocalCenters(next)
                              return next
                            })
                          } catch (error) {
                            toast.error('Unable to locate address for directions')
                            return
                          }
                        }

                        const focus = {
                          id: center.id,
                          name: center.name,
                          latitude,
                          longitude,
                        }
                        window.localStorage.setItem('evacuation_center_focus', JSON.stringify(focus))
                        onNavigate?.('map')
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!center.contactNumber) return
                        const phone = center.contactNumber.replace(/\s+/g, '')
                        window.open(`tel:${phone}`, '_self')
                      }}
                      disabled={!center.contactNumber}
                    >
                      Call
                    </Button>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Updated {new Date(center.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Center Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Evacuation Center</DialogTitle>
            <DialogDescription>
              Register a new evacuation center to help communities
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Center Name</label>
              <Input
                placeholder="e.g., Central Elementary School"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Textarea
                placeholder="Full address including barangay"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Capacity</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contact Number</label>
                <Input
                  placeholder="+63 912 345 6789"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Latitude (optional)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="14.5995"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Longitude (optional)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="120.9842"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name || !formData.address || formData.capacity <= 0}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? 'Adding...' : 'Add Center'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
