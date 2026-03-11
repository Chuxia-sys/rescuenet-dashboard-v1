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
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react'

interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  skills: string[]
  status: 'available' | 'on-mission' | 'offline'
  assignedMissions: number
  createdAt: string
}

const skillsList = [
  'First Aid',
  'Search & Rescue',
  'Medical',
  'Logistics',
  'Communications',
  'Driving',
  'Cooking',
  'Counseling',
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'on-mission', label: 'On Mission' },
  { value: 'offline', label: 'Offline' },
]

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: [] as string[],
  })

  useEffect(() => {
    loadVolunteers()
  }, [])

  const loadVolunteers = async () => {
    try {
      const data = await blink.db.volunteers.list({
        orderBy: { createdAt: 'desc' },
      })
      setVolunteers(data as Volunteer[])
    } catch (error) {
      console.error('Error loading volunteers:', error)
      // Use mock data if DB not available
      setVolunteers([
        {
          id: '1',
          name: 'Pedro Garcia',
          email: 'pedro.garcia@email.com',
          phone: '+63 912 345 6789',
          location: 'Barangay San Jose',
          skills: ['First Aid', 'Search & Rescue'],
          status: 'available',
          assignedMissions: 12,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria.santos@email.com',
          phone: '+63 917 123 4567',
          location: 'Poblacion',
          skills: ['Medical', 'Counseling'],
          status: 'on-mission',
          assignedMissions: 8,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          name: 'Jose Reyes',
          email: 'jose.reyes@email.com',
          phone: '+63 918 987 6543',
          location: 'Barangay Maligaya',
          skills: ['Logistics', 'Driving'],
          status: 'available',
          assignedMissions: 5,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
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

      await blink.db.volunteers.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        skills: JSON.stringify(formData.skills),
        status: 'available',
        assignedMissions: 0,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        skills: [],
      })
      setIsDialogOpen(false)
      loadVolunteers()
    } catch (error) {
      console.error('Error creating volunteer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 text-white'
      case 'on-mission':
        return 'bg-blue-500 text-white'
      case 'offline':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />
      case 'on-mission':
        return <Clock className="h-3 w-3" />
      case 'offline':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Volunteer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage volunteer assignments and availability
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Volunteer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {volunteers.filter((v) => v.status === 'available').length}
                </p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {volunteers.filter((v) => v.status === 'on-mission').length}
                </p>
                <p className="text-sm text-muted-foreground">On Mission</p>
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
                <p className="text-2xl font-bold text-foreground">{volunteers.length}</p>
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {volunteers.reduce((acc, v) => acc + v.assignedMissions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Missions</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Volunteers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="elevation-1 border-border/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <Card className="elevation-1 border-border/50">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No volunteers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVolunteers.map((volunteer) => (
            <Card key={volunteer.id} className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {volunteer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{volunteer.name}</h3>
                      <Badge className={`${getStatusColor(volunteer.status)} text-xs mt-1`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(volunteer.status)}
                          {volunteer.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{volunteer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{volunteer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{volunteer.location}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {volunteer.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {volunteer.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{volunteer.skills.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{volunteer.assignedMissions}</span> missions
                  </div>
                  <Button variant="outline" size="sm">
                    Assign Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Volunteer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Volunteer</DialogTitle>
            <DialogDescription>
              Register a new volunteer to the response team
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  placeholder="+63 912 345 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                placeholder="Current location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Skills</label>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <Badge
                    key={skill}
                    variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        skills: formData.skills.includes(skill)
                          ? formData.skills.filter((s) => s !== skill)
                          : [...formData.skills, skill],
                      })
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name || !formData.email || !formData.location}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? 'Adding...' : 'Add Volunteer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}