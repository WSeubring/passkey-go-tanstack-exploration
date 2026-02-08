import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { usePasskeyLogin } from '@/hooks/usePasskeyLogin'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PasskeyFlowVisualization } from "@/components/passkey-flow/PasskeyFlowVisualization"

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left panel: Passkey flow visualization */}
      <div className="flex max-h-[60vh] flex-1 items-center justify-center overflow-hidden bg-muted p-6 lg:max-h-none lg:p-12">
        <PasskeyFlowVisualization />
      </div>

      {/* Right panel: Login form */}
      <div className="flex items-center justify-center bg-gray-100 p-4 dark:bg-gray-900 lg:w-[42%] lg:min-w-[420px]">
        <LoginForm />
      </div>
    </div>
  )
}

export function LoginForm() {
  const navigate = useNavigate()
  const { status, message, loginWithPasskey } = usePasskeyLogin()

  const handlePasskeyLogin = async () => {
    await loginWithPasskey()
  }

  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => navigate({ to: '/dashboard' }), 800)
    return () => clearTimeout(timer)
  }, [status, navigate])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Sign in using your passkey.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <Button 
              className="w-full h-12 text-lg font-medium"
              onClick={handlePasskeyLogin}
              disabled={status === 'loading'}
          >
              {status === 'loading' ? 'Signing in...' : 'Sign in with Passkey'}
          </Button>

          {message && (
              <div className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
              </div>
          )}
      </CardContent>
      <CardFooter className="flex justify-center">
           <Button variant="link" asChild>
              <Link to="/register">Create a new Passkey account</Link>
           </Button>
      </CardFooter>
    </Card>
  )
}
