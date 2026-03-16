import { useState } from 'react'
import { blink } from '@/lib/blink'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, Radio, Users } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await blink.auth.login()
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to login. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">RescueNet</h1>
            <p className="text-white/80 text-sm">Community Disaster Response Platform</p>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-white font-heading leading-tight">
            Empowering Communities<br />
            <span className="text-white/90">to Respond Together</span>
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Coordinate rescue operations, locate evacuation centers, and manage disaster response—all in one unified platform.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <AlertTriangle className="h-5 w-5 text-white mb-2" />
              <p className="text-white font-medium text-sm">Real-time Alerts</p>
              <p className="text-white/70 text-xs mt-1">Instant disaster notifications</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Radio className="h-5 w-5 text-white mb-2" />
              <p className="text-white font-medium text-sm">Coordination Hub</p>
              <p className="text-white/70 text-xs mt-1">Rescue team management</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Users className="h-5 w-5 text-white mb-2" />
              <p className="text-white font-medium text-sm">Volunteer Network</p>
              <p className="text-white/70 text-xs mt-1">Community mobilization</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Shield className="h-5 w-5 text-white mb-2" />
              <p className="text-white font-medium text-sm">Safe Zones</p>
              <p className="text-white/70 text-xs mt-1">Evacuation center finder</p>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm">
          © 2024 RescueNet. Built for community safety.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-heading">RescueNet</h1>
              <p className="text-muted-foreground text-sm">Disaster Response Platform</p>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground font-heading">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access the disaster response dashboard
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                'Sign in to Dashboard'
              )}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                Secure authentication
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Privacy Protected</p>
                <p className="text-muted-foreground mt-1">
                  Your credentials are securely managed. Only authorized personnel can access sensitive disaster data.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-sm">
            Need access?{' '}
            <button className="text-primary hover:underline font-medium">
              Request account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}