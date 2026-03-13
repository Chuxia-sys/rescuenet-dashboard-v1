import { useState } from 'react'
import { blink } from '@/lib/blink'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Home,
  Radio,
  Users,
  Package,
  Bell,
  ChevronDown,
  LogOut,
  Shield,
  Menu,
  X,
  Megaphone,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

interface DashboardLayoutProps {
  user: any
  currentPage: string
  onPageChange: (page: string) => void
  children: React.ReactNode
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'disasters', label: 'Disaster Reports', icon: AlertTriangle },
  { id: 'map', label: 'Interactive Map', icon: Map },
  { id: 'evacuation', label: 'Evacuation Centers', icon: Home },
  { id: 'rescue', label: 'Rescue Requests', icon: Radio },
  { id: 'volunteers', label: 'Volunteers', icon: Users },
  { id: 'resources', label: 'Resources', icon: Package },
  { id: 'alerts', label: 'Emergency Alerts', icon: Megaphone },
]

export default function DashboardLayout({
  user,
  currentPage,
  onPageChange,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user)

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 lg:z-0',
          'w-64 bg-sidebar flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground font-heading">
              RescueNet
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Disaster Response</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onPageChange(item.id)
                setSidebarOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all duration-200',
                'hover:bg-sidebar-accent',
                currentPage === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-primary">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-foreground hover:bg-sidebar-accent transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>

            {/* Page Title */}
            <div>
              <h2 className="text-lg font-semibold text-foreground font-heading">
                {navigationItems.find((n) => n.id === currentPage)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-alert-emergency rounded-full animate-pulse" />
                )}
              </Button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-lg border border-border shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={cn(
                                "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                                !notif.read && "bg-primary/5"
                              )}
                              onClick={() => {
                                markAsRead(notif.id)
                                // Handle navigation based on type if needed
                              }}
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                  notif.severity === 'emergency' ? "bg-alert-emergency/10 text-alert-emergency" :
                                  notif.severity === 'warning' ? "bg-alert-warning/10 text-alert-warning" :
                                  "bg-primary/10 text-primary"
                                )}>
                                  {notif.type === 'disaster' ? <AlertTriangle className="h-4 w-4" /> :
                                   notif.type === 'rescue' ? <Radio className="h-4 w-4" /> :
                                   notif.type === 'alert' ? <Megaphone className="h-4 w-4" /> :
                                   <Bell className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm", !notif.read ? "font-semibold" : "font-medium")}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-border bg-muted/10 text-center">
                      <button 
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                          onPageChange('alerts')
                          setNotifOpen(false)
                        }}
                      >
                        View all alerts
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg border border-border shadow-lg z-50 py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onPageChange('settings')
                        setProfileOpen(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}