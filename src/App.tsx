import { useState, useEffect } from 'react'
import { blink } from './lib/blink'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import DisasterReportsPage from './pages/DisasterReportsPage'
import MapPage from './pages/MapPage'
import EvacuationCentersPage from './pages/EvacuationCentersPage'
import RescueRequestsPage from './pages/RescueRequestsPage'
import VolunteersPage from './pages/VolunteersPage'
import ResourcesPage from './pages/ResourcesPage'
import AlertsPage from './pages/AlertsPage'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const unsubscribe = blink.auth.onAuthStateChanged((state) => {
        setUser(state.user)
        setLoading(state.isLoading)
      })
      return unsubscribe
    } catch (err) {
      console.error('Auth error:', err)
      setError('Failed to initialize auth')
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-medium">Loading RescueNet...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />
      case 'disasters':
        return <DisasterReportsPage />
      case 'map':
        return <MapPage />
      case 'evacuation':
        return <EvacuationCentersPage onNavigate={setCurrentPage} />
      case 'rescue':
        return <RescueRequestsPage />
      case 'volunteers':
        return <VolunteersPage />
      case 'resources':
        return <ResourcesPage />
      case 'alerts':
        return <AlertsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <DashboardLayout 
      user={user} 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
    >
      {renderPage()}
    </DashboardLayout>
  )
}