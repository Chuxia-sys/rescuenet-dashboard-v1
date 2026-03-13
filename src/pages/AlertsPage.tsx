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
import { Megaphone, Plus, AlertTriangle, Send, Bell, MapPin, Trash2, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: string
  title: string
  message: string
  severity: 'emergency' | 'warning' | 'info'
  status: 'active' | 'resolved'
  targetArea?: string
  createdAt: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: 'info',
    targetArea: '',
  })

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const data = await blink.db.alerts.list({
        orderBy: { createdAt: 'desc' },
      })
      setAlerts(data as Alert[])
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = await blink.auth.me()
      if (!user) return

      const newAlert = await blink.db.alerts.create({
        title: formData.title,
        message: formData.message,
        severity: formData.severity,
        status: 'active',
        targetArea: formData.targetArea || null,
        userId: user.id,
        createdAt: new Date().toISOString(),
      })

      // Broadcast to all connected users via realtime
      await blink.realtime.publish('emergency-alerts', 'alert', {
        title: formData.title,
        message: formData.message,
        severity: formData.severity,
        type: 'alert'
      })

      toast.success('Alert broadcasted successfully')
      setFormData({ title: '', message: '', severity: 'info', targetArea: '' })
      setIsDialogOpen(false)
      loadAlerts()
    } catch (error) {
      console.error('Error broadcasting alert:', error)
      toast.error('Failed to broadcast alert')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteAlert = async (id: string) => {
    try {
      await blink.db.alerts.delete(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      toast.success('Alert deleted')
    } catch (error) {
      toast.error('Failed to delete alert')
    }
  }

  const resolveAlert = async (id: string) => {
    try {
      await blink.db.alerts.update(id, { status: 'resolved' })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
      toast.success('Alert marked as resolved')
    } catch (error) {
      toast.error('Failed to resolve alert')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Emergency Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Broadcast emergency notifications to the community
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-alert-emergency hover:bg-alert-emergency/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Broadcast
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Recent Broadcasts
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse border-border/50">
                  <CardContent className="p-6">
                    <div className="h-4 w-1/4 bg-muted rounded mb-4" />
                    <div className="h-3 w-full bg-muted rounded mb-2" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <Card className="elevation-1 border-border/50">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No alerts have been broadcasted yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={cn(
                  "elevation-1 border-border/50 hover:elevation-2 transition-all",
                  alert.status === 'resolved' && "opacity-60 bg-muted/20"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          alert.status === 'resolved' ? "bg-muted text-muted-foreground" :
                          alert.severity === 'emergency' ? "bg-alert-emergency/10 text-alert-emergency" :
                          alert.severity === 'warning' ? "bg-alert-warning/10 text-alert-warning" :
                          "bg-primary/10 text-primary"
                        )}>
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground">{alert.title}</h3>
                            <Badge variant={alert.status === 'resolved' ? 'outline' : alert.severity === 'emergency' ? 'destructive' : alert.severity === 'warning' ? 'secondary' : 'outline'}>
                              {alert.status === 'resolved' ? 'resolved' : alert.severity}
                            </Badge>
                          </div>
                          <p className="text-foreground/80">{alert.message}</p>
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                            {alert.targetArea && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>Target: {alert.targetArea}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {alert.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive self-end"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="elevation-1 border-border/50 bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Broadcast Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground">
                Broadcasted alerts are sent in real-time to all connected users and saved in the community database.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><span className="font-medium text-foreground">Emergency</span>: Immediate threat to life/property</li>
                <li><span className="font-medium text-foreground">Warning</span>: High probability of incident</li>
                <li><span className="font-medium text-foreground">Info</span>: General safety updates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="elevation-1 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Target Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-sm font-medium">All Communities</p>
                <p className="text-xs text-muted-foreground mt-1">Broadcast to everyone registered</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-sm font-medium">Zone 1 (Coastal)</p>
                <p className="text-xs text-muted-foreground mt-1">Specific to flood-prone areas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Broadcast Emergency Alert</DialogTitle>
            <DialogDescription>
              Create a notification that will be sent to all community members
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBroadcast} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Alert Severity</label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger className={cn(
                  formData.severity === 'emergency' && "border-alert-emergency text-alert-emergency bg-alert-emergency/5",
                  formData.severity === 'warning' && "border-alert-warning text-alert-warning bg-alert-warning/5"
                )}>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">🚨 Emergency (Critical)</SelectItem>
                  <SelectItem value="warning">⚠️ Warning (Urgent)</SelectItem>
                  <SelectItem value="info">ℹ️ Information (Normal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Alert Title</label>
              <Input
                placeholder="Short, clear headline (e.g. Flash Flood Warning)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target Area</label>
              <Input
                placeholder="e.g. Barangay San Jose, Zone 3 (optional)"
                value={formData.targetArea}
                onChange={(e) => setFormData({ ...formData, targetArea: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Message</label>
              <Textarea
                placeholder="Provide clear instructions and details..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.title || !formData.message}
                className={cn(
                  "text-white",
                  formData.severity === 'emergency' ? "bg-alert-emergency hover:bg-alert-emergency/90" :
                  formData.severity === 'warning' ? "bg-alert-warning hover:bg-alert-warning/90" :
                  "bg-primary hover:bg-primary/90"
                )}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
