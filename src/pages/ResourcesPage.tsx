import { useState, useEffect } from 'react'
import { blink } from '@/lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Package,
  Droplet,
  Bed,
  Pill,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface Resource {
  id: string
  name: string
  category: string
  currentStock: number
  maxCapacity: number
  unit: string
  lastUpdated: string
}

const resourceCategories = [
  { id: 'food', name: 'Food Packs', icon: Package, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'water', name: 'Water', icon: Droplet, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'blankets', name: 'Blankets', icon: Bed, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'medicine', name: 'Medicine', icon: Pill, color: 'text-red-500', bgColor: 'bg-red-500/10' },
]

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    category: '',
  })

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      const data = await blink.db.resources.list({
        orderBy: { category: 'asc' },
      })
      setResources(data as Resource[])
    } catch (error) {
      console.error('Error loading resources:', error)
      // Use mock data if DB not available
      setResources([
        { id: '1', name: 'Rice Packs (25kg)', category: 'food', currentStock: 150, maxCapacity: 500, unit: 'packs', lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Canned Goods', category: 'food', currentStock: 320, maxCapacity: 400, unit: 'cans', lastUpdated: new Date().toISOString() },
        { id: '3', name: 'Bottled Water (500ml)', category: 'water', currentStock: 800, maxCapacity: 1000, unit: 'bottles', lastUpdated: new Date().toISOString() },
        { id: '4', name: 'Gallons (5L)', category: 'water', currentStock: 120, maxCapacity: 200, unit: 'gallons', lastUpdated: new Date().toISOString() },
        { id: '5', name: 'Blankets', category: 'blankets', currentStock: 85, maxCapacity: 150, unit: 'pcs', lastUpdated: new Date().toISOString() },
        { id: '6', name: 'Sleeping Mats', category: 'blankets', currentStock: 60, maxCapacity: 100, unit: 'pcs', lastUpdated: new Date().toISOString() },
        { id: '7', name: 'First Aid Kits', category: 'medicine', currentStock: 35, maxCapacity: 50, unit: 'kits', lastUpdated: new Date().toISOString() },
        { id: '8', name: 'Pain Relievers', category: 'medicine', currentStock: 200, maxCapacity: 500, unit: 'tablets', lastUpdated: new Date().toISOString() },
        { id: '9', name: 'Antibiotics', category: 'medicine', currentStock: 45, maxCapacity: 100, unit: 'bottles', lastUpdated: new Date().toISOString() },
        { id: '10', name: 'Instant Noodles', category: 'food', currentStock: 450, maxCapacity: 600, unit: 'packs', lastUpdated: new Date().toISOString() },
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

      await blink.db.resources.create({
        name: formData.name,
        category: formData.category,
        currentStock: formData.quantity,
        maxCapacity: formData.quantity * 2,
        unit: 'units',
        userId: user.id,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      })

      setFormData({ name: '', quantity: 0, category: '' })
      setIsDialogOpen(false)
      loadResources()
    } catch (error) {
      console.error('Error creating resource:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const getStockColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStockStatus = (percentage: number) => {
    if (percentage >= 70) return { label: 'Good', color: 'text-green-500' }
    if (percentage >= 40) return { label: 'Moderate', color: 'text-orange-500' }
    return { label: 'Critical', color: 'text-red-500' }
  }

  const getCategoryStats = (category: string) => {
    const categoryResources = resources.filter((r) => r.category === category)
    const totalCurrent = categoryResources.reduce((acc, r) => acc + r.currentStock, 0)
    const totalMax = categoryResources.reduce((acc, r) => acc + r.maxCapacity, 0)
    return {
      total: categoryResources.length,
      current: totalCurrent,
      max: totalMax,
      percentage: totalMax > 0 ? getStockPercentage(totalCurrent, totalMax) : 0,
    }
  }

  const lowStockItems = resources.filter((r) => {
    const percentage = getStockPercentage(r.currentStock, r.maxCapacity)
    return percentage < 40
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">Resource Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage disaster relief supplies
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {resourceCategories.map((category) => {
          const stats = getCategoryStats(category.id)
          const Icon = category.icon
          return (
            <Card
              key={category.id}
              className={`elevation-1 border-border/50 hover:elevation-2 transition-all duration-200 cursor-pointer ${
                selectedCategory === category.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{category.name}</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stats.percentage >= 70 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : stats.percentage < 40 ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : null}
                      <span className="text-xs text-muted-foreground">{stats.percentage}% capacity</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="elevation-1 border-border/50 bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Low Stock Warning</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {lowStockItems.length} items are running low on stock and need replenishment.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600"
                    >
                      {item.name}
                    </span>
                  ))}
                  {lowStockItems.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600">
                      +{lowStockItems.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="elevation-1 border-border/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(selectedCategory
            ? resources.filter((r) => r.category === selectedCategory)
            : resources
          ).map((resource) => {
            const percentage = getStockPercentage(resource.currentStock, resource.maxCapacity)
            const status = getStockStatus(percentage)
            const category = resourceCategories.find((c) => c.id === resource.category)
            const Icon = category?.icon || Package

            return (
              <Card key={resource.id} className="elevation-1 border-border/50 hover:elevation-2 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${category?.bgColor || 'bg-muted'} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${category?.color || 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{resource.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{resource.category}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className="font-medium text-foreground">
                        {resource.currentStock.toLocaleString()} / {resource.maxCapacity.toLocaleString()} {resource.unit}
                      </span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${getStockColor(percentage)} transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(resource.lastUpdated).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-medium text-foreground">{percentage}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1">
                      Update Stock
                    </Button>
                    <Button variant="outline" size="sm">
                      History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Resource Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add New Resource</DialogTitle>
            <DialogDescription>
              Add a new resource to track in inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Resource Name</label>
              <Input
                placeholder="e.g., Rice Packs (25kg)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {resourceCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name || !formData.category}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? 'Adding...' : 'Add Resource'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}