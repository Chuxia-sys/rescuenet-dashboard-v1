import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Layers, AlertTriangle, Home, Radio, Filter } from 'lucide-react'

export default function MapPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Interactive Map</h1>
          <p className="text-muted-foreground mt-1">
            View disaster locations and evacuation centers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Layers
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Map Placeholder */}
      <Card className="elevation-1 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[600px] bg-gradient-to-br from-primary/5 to-secondary/5 relative">
            {/* Placeholder Map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">Interactive Map View</p>
                <p className="text-muted-foreground mt-1">
                  Map integration coming soon
                </p>
              </div>
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-4 elevation-2">
              <p className="text-sm font-medium text-foreground mb-3">Map Legend</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Flood Reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-muted-foreground">Fire Incidents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-muted-foreground">Rescue Requests</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Evacuation Centers</span>
                </div>
              </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur rounded-lg p-4 elevation-2">
              <p className="text-sm font-medium text-foreground mb-2">Active Incidents</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-red-500">23</p>
                  <p className="text-xs text-muted-foreground">Floods</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">12</p>
                  <p className="text-xs text-muted-foreground">Fires</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">47</p>
                  <p className="text-xs text-muted-foreground">Rescues</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">8</p>
                  <p className="text-xs text-muted-foreground">Centers</p>
                </div>
              </div>
            </div>
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
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">Flood Reports</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-foreground">Fire Incidents</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20 transition-colors">
              <Radio className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-foreground">Rescue Requests</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-colors">
              <Home className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-foreground">Evacuation Centers</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}