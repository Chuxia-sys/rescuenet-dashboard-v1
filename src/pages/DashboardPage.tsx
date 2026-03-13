import { useState, useEffect } from 'react'
import { blink } from '@/lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Radio,
  Home,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Plus,
  Megaphone,
} from 'lucide-react'

interface Disaster {
  id: string
  type: string
  location: string
  description: string
  status: string
  createdAt: string
  image?: string
}

interface Stats {
  activeDisasters: number
  rescueRequests: number
  evacuationCenters: number
  activeVolunteers: number
  activeAlerts: number
}

export default function DashboardPage() {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    activeDisasters: 0,
    rescueRequests: 0,
    evacuationCenters: 0,
    activeVolunteers: 0,
    activeAlerts: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [disasterData, rescueData, centerData, volunteerData, alertData] = await Promise.all([
        blink.db.disasters.list({ orderBy: { createdAt: 'desc' }, limit: 10 }),
        blink.db.rescue_requests.list({ where: { status: 'pending' } }),
        blink.db.evacuation_centers.list({ where: { status: 'open' } }),
        blink.db.volunteers.list({ where: { status: 'available' } }),
        blink.db.alerts.list({ limit: 5 }),
      ])

      setDisasters(disasterData as Disaster[])
      
      setStats({
        activeDisasters: disasterData.filter((d: any) => d.status !== 'resolved').length,
        rescueRequests: rescueData.length,
        evacuationCenters: centerData.length,
        activeVolunteers: volunteerData.length,
        activeAlerts: alertData.length,
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-alert-warning text-white'
      case 'verified':
      case 'active':
        return 'bg-alert-emergency text-white'
      case 'resolved':
        return 'bg-alert-safe text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getDisasterIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flood':
        return '🌊'
      case 'fire':
        return '🔥'
      case 'landslide':
        return '⛰️'
      case 'earthquake':
        return '🌍'
      case 'typhoon':
        return '🌀'
      default:
        return '⚠️'
    }
  }

  const quickActions = [
    { label: 'Report Incident', icon: Plus, color: 'bg-primary hover:bg-primary/90' },
    { label: 'Request Rescue', icon: Radio, color: 'bg-alert-emergency hover:bg-alert-emergency/90' },
    { label: 'View Evacuation Centers', icon: Home, color: 'bg-secondary hover:bg-secondary/90' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor active disasters and coordinate response efforts
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Disasters</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {loading ? '...' : stats.activeDisasters}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                  <TrendingUp className="h-3 w-3" />
                  <span>+2 this hour</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-alert-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-alert-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rescue Requests</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {loading ? '...' : stats.rescueRequests}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                  <TrendingUp className="h-3 w-3" />
                  <span>+5 critical</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-alert-emergency/10 flex items-center justify-center">
                <Radio className="h-6 w-6 text-alert-emergency" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Evacuation Centers</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {loading ? '...' : stats.evacuationCenters}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-alert-safe">
                  <span className="h-2 w-2 rounded-full bg-alert-safe" />
                  <span>8 open now</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-alert-safe/10 flex items-center justify-center">
                <Home className="h-6 w-6 text-alert-safe" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Volunteers</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {loading ? '...' : stats.activeVolunteers}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <Users className="h-3 w-3" />
                  <span>12 online now</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="elevation-1 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-heading">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                className={`${action.color} text-white`}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="elevation-1 border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">Recent Disaster Reports</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="h-12 w-12 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : disasters.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No disaster reports yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Reports will appear here when incidents are reported
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disasters.slice(0, 5).map((disaster) => (
                    <div
                      key={disaster.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-lg bg-card border border-border flex items-center justify-center text-2xl">
                        {getDisasterIcon(disaster.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {disaster.type} - {disaster.location}
                          </p>
                          <Badge className={`${getStatusColor(disaster.status)} text-xs`}>
                            {disaster.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {disaster.description}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground hidden sm:block">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{disaster.location}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(disaster.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <Card className="elevation-1 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '2m ago', action: 'New disaster report', type: 'disaster', icon: AlertTriangle },
                  { time: '5m ago', action: 'Rescue team dispatched', type: 'rescue', icon: Radio },
                  { time: '12m ago', action: 'Volunteer checked in', type: 'volunteer', icon: Users },
                  { time: '25m ago', action: 'Emergency alert sent', type: 'alert', icon: Megaphone },
                  { time: '1h ago', action: 'Evacuation center updated', type: 'evacuation', icon: Home },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'disaster' ? 'bg-alert-warning/10' :
                      activity.type === 'rescue' ? 'bg-alert-emergency/10' :
                      activity.type === 'volunteer' ? 'bg-primary/10' :
                      activity.type === 'alert' ? 'bg-destructive/10' :
                      'bg-alert-safe/10'
                    }`}>
                      <activity.icon className={`h-4 w-4 ${
                        activity.type === 'disaster' ? 'text-alert-warning' :
                        activity.type === 'rescue' ? 'text-alert-emergency' :
                        activity.type === 'volunteer' ? 'text-primary' :
                        activity.type === 'alert' ? 'text-destructive' :
                        'text-alert-safe'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
