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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Upload,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Disaster {
  id: string
  type: string
  location: string
  description: string
  status: string
  createdAt: string
  image?: string
  userId: string
}

const disasterTypes = [
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'landslide', label: 'Landslide', icon: '⛰️' },
  { value: 'earthquake', label: 'Earthquake', icon: '🌍' },
  { value: 'typhoon', label: 'Typhoon', icon: '🌀' },
  { value: 'other', label: 'Other', icon: '⚠️' },
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
]

export default function DisasterReportsPage() {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Form state
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    description: '',
    image: '',
  })

  useEffect(() => {
    loadDisasters()
  }, [])

  const loadDisasters = async () => {
    try {
      const data = await blink.db.disasters.list({
        orderBy: { createdAt: 'desc' },
      })
      setDisasters(data as Disaster[])
    } catch (error) {
      console.error('Error loading disasters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const extension = file.name.split('.').pop()
      const path = `disasters/${Date.now()}.${extension}`
      
      const { publicUrl } = await blink.storage.upload(file, path, {
        onProgress: (percent) => setUploadProgress(percent)
      })

      setFormData(prev => ({ ...prev, image: publicUrl }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = await blink.auth.me()
      if (!user) return

      await blink.db.disasters.create({
        type: formData.type,
        location: formData.location,
        description: formData.description,
        status: 'pending',
        image: formData.image || null,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Notify others via realtime
      await blink.realtime.publish('emergency-alerts', 'disaster-report', {
        title: `New Incident: ${formData.type}`,
        message: `A new ${formData.type} incident has been reported at ${formData.location}`,
        type: 'disaster',
        severity: 'warning'
      })

      toast.success('Incident reported successfully')
      // Reset form and close dialog
      setFormData({ type: '', location: '', description: '', image: '' })
      setIsDialogOpen(false)
      loadDisasters()
    } catch (error) {
      console.error('Error creating disaster:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDisasters = disasters.filter((d) => {
    const matchesSearch = 
      d.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    const matchesType = typeFilter === 'all' || d.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white'
      case 'verified':
      case 'active':
        return 'bg-red-500 text-white'
      case 'resolved':
        return 'bg-green-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getDisasterIcon = (type: string) => {
    const found = disasterTypes.find((d) => d.value === type.toLowerCase())
    return found?.icon || '⚠️'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Disaster Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all reported incidents
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
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
                  placeholder="Search by type, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {disasterTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4" />
        <span>Showing {filteredDisasters.length} of {disasters.length} reports</span>
      </div>

      {/* Disaster Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <Card className="elevation-1 border-border/50">
                <CardContent className="p-6">
                  <div className="h-4 w-3/4 bg-muted rounded mb-4" />
                  <div className="h-3 w-1/2 bg-muted rounded mb-3" />
                  <div className="h-3 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : filteredDisasters.length === 0 ? (
        <Card className="elevation-1 border-border/50">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No disaster reports found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Try adjusting your filters or create a new report
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDisasters.map((disaster) => (
            <Card
              key={disaster.id}
              className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200 cursor-pointer"
            >
              <CardContent className="p-4">
                {/* Image */}
                {disaster.image && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                    <img
                      src={disaster.image}
                      alt={disaster.type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getDisasterIcon(disaster.type)}</span>
                    <div>
                      <h3 className="font-medium text-foreground capitalize">{disaster.type}</h3>
                      <Badge className={`${getStatusColor(disaster.status)} text-xs mt-1`}>
                        {disaster.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{disaster.location}</span>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2">
                    {disaster.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(disaster.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Report New Incident</DialogTitle>
            <DialogDescription>
              Submit a new disaster report to alert response teams
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Incident Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {disasterTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                placeholder="e.g., Downtown Manila, Barangay 123"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Provide details about the incident..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Incident Image</label>
              
              {formData.image ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm font-medium">{uploadProgress}% Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Click to upload or drag and drop</p>
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Select Image
                          </span>
                        </Button>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.type || !formData.location || !formData.description}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
