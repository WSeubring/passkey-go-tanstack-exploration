import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { usePasskeyRegistration } from '@/hooks/usePasskeyRegistration'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute('/register')({
  component: RegisterForm,
})

export function RegisterForm() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const { status, message, register } = usePasskeyRegistration()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    await register(username)
  }

  if (status === 'success') {
    setTimeout(() => navigate({ to: '/' }), 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register Passkey</CardTitle>
          <CardDescription>Create a new account with a passkey.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="jdoe"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {message && (
               <div className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                   {message}
               </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Registering...' : 'Create Passkey'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
