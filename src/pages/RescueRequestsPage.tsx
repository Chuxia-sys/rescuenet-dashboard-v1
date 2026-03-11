import { useState, useEffect } from 'react'
import { blink } from '@/lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Radio,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  Phone,
  UserPlus,
} from 'lucide-react'

interface RescueRequest {
  id: string
  name: string
  location: string
  emergencyType: string
  peopleCount: number
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved'
  contactNumber?: string
  description?: string
  createdAt: string
  assignedTeam?: string
}

const emergencyTypes = [
  { value: 'flood', label: 'Flood Rescue', icon: '🌊' },
  { value: 'fire', label: 'Fire Evacuation', icon: '🔥' },
  { value: 'landslide', label: 'Landslide', icon: '⛰️' },
  { value: 'medical', label: 'Medical Emergency', icon: '🏥' },
  { value: 'trapped', label: 'Trapped Persons', icon: '🚨' },
  { value: 'other', label: 'Other', icon: '⚠️' },
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function RescueRequestsPage() {
  const [requests, setRequests] = useState<RescueRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    emergencyType: '',
    peopleCount: 1,
    contactNumber: '',
    description: '',
  })

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const data = await blink.db.rescue_requests.list({
        orderBy: { createdAt: 'desc' },
      })
      setRequests(data as RescueRequest[])
    } catch (error) {
      console.error('Error loading requests:', error)
      // Use mock data if DB not available
      setRequests([
        {
          id: '1',
          name: 'Maria Santos',
          location: 'Barangay San Jose, Zone 3',
          emergencyType: 'flood',
          peopleCount: 5,
          status: 'pending',
          contactNumber: '+63 912 345 6789',
          description: 'Family trapped on second floor due to rising floodwaters',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Juan Dela Cruz',
          location: '123 Rizal Street, Poblacion',
          emergencyType: 'fire',
          peopleCount: 3,
          status: 'assigned',
          contactNumber: '+63 917 123 4567',
          description: 'Fire spreading near residential area',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          name: 'Ana Reyes',
          location: 'Hillside Road, Barangay Maligaya',
          emergencyType: 'landslide',
          peopleCount: 2,
          status: 'in-progress',
          contactNumber: '+63 918 987 6543',
          description: 'Landslide blocking evacuation route',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = await blink.auth.me()
      if (!user) return

      await blink.db.rescue_requests.create({
        name: formData.name,
        location: formData.location,
        emergencyType: formData.emergencyType,
        peopleCount: formData.peopleCount,
        status: 'pending',
        contactNumber: formData.contactNumber || null,
        description: formData.description || null,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setFormData({
        name: '',
        location: '',
        emergencyType: '',
        peopleCount: 1,
        contactNumber: '',
        description: '',
      })
      setIsDialogOpen(false)
      loadRequests()
    } catch (error) {
      console.error('Error creating request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white'
      case 'assigned':
        return 'bg-blue-500 text-white'
      case 'in-progress':
        return 'bg-orange-500 text-white'
      case 'resolved':
        return 'bg-green-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getEmergencyIcon = (type: string) => {
    const found = emergencyTypes.find((e) => e.value === type)
    return found?.icon || '⚠️'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Rescue Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and coordinate rescue operations
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-alert-emergency hover:bg-alert-emergency/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="elevation-1 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter((r) => r.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter((r) => r.status === 'assigned').length}
                </p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter((r) => r.status === 'in-progress').length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.reduce((acc, r) => acc + r.peopleCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">People</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="elevation-1 border-border/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="elevation-1 border-border/50">
          <CardContent className="py-12 text-center">
            <Radio className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No rescue requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Icon & Status */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-card border border-border flex items-center justify-center text-2xl">
                      {getEmergencyIcon(request.emergencyType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{request.name}</h3>
                        <Badge className={`${getStatusColor(request.status)} text-xs`}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize mb-2">
                        {request.emergencyType} Emergency
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{request.peopleCount} people</span>
                        </div>
                        {request.contactNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{request.contactNumber}</span>
                          </div>
                        )}
                      </div>
                      {request.description && (
                        <p className="text-sm text-foreground/80 mt-2">{request.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(request.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    {request.status === 'pending' && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Assign Team
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">New Rescue Request</DialogTitle>
            <DialogDescription>
              Submit a rescue request for immediate assistance
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contact Name</label>
                <Input
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <Input
                  placeholder="+63 912 345 6789"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Emergency Type</label>
              <Select
                value={formData.emergencyType}
                onValueChange={(value) => setFormData({ ...formData, emergencyType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  {emergencyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                placeholder="Current location or address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Number of People</label>
              <Input
                type="number"
                min="1"
                value={formData.peopleCount}
                onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description (Optional)</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Additional details about the emergency..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name || !formData.location || !formData.emergencyType}
                className="bg-alert-emergency hover:bg-alert-emergency/90"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}