"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function ChangePasswordPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /[0-9]/.test(password)
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
    const isNotDefaultPassword = password !== "ChangeMe123"
    
    return {
      isValid: password.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isNotDefaultPassword,
      errors: {
        length: password.length < 8 ? "Password must be at least 8 characters" : "",
        uppercase: !hasUpperCase ? "Password must contain at least one uppercase letter" : "",
        lowercase: !hasLowerCase ? "Password must contain at least one lowercase letter" : "",
        numbers: !hasNumbers ? "Password must contain at least one number" : "",
        special: !hasSpecialChar ? "Password must contain at least one special character" : "",
        default: !isNotDefaultPassword ? "Password cannot be the default password" : ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Validate passwords
    const newPasswordValidation = validatePassword(newPassword)
    
    if (!newPasswordValidation.isValid) {
      const firstError = Object.values(newPasswordValidation.errors).find(error => error !== "")
      setError(firstError || "Password does not meet requirements")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess("Password changed successfully!")
        // Sign out and redirect to sign in
        setTimeout(async () => {
          await signIn("credentials", {
            email: session?.user?.email,
            password: newPassword,
            redirect: false
          })
          router.push("/auth/signin")
        }, 1500)
      } else {
        setError(data.error || "Failed to change password")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Required</CardTitle>
            <CardDescription>Please sign in to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/auth/signin")} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Change Password</h1>
          <p className="text-muted-foreground">
            {session?.user?.mustChangePassword 
              ? "Please change your default password before continuing."
              : "Update your account password for security."
            }
          </p>
        </div>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Enter your current password and choose a new secure password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={loading}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {newPassword && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-1">
                    <div className={validatePassword(newPassword).errors.length ? "text-red-500" : "text-green-500"}>
                      ✓ At least 8 characters
                    </div>
                    <div className={validatePassword(newPassword).errors.uppercase ? "text-red-500" : "text-green-500"}>
                      ✓ Contains uppercase letter
                    </div>
                    <div className={validatePassword(newPassword).errors.lowercase ? "text-red-500" : "text-green-500"}>
                      ✓ Contains lowercase letter
                    </div>
                    <div className={validatePassword(newPassword).errors.numbers ? "text-red-500" : "text-green-500"}>
                      ✓ Contains number
                    </div>
                    <div className={validatePassword(newPassword).errors.special ? "text-red-500" : "text-green-500"}>
                      ✓ Contains special character
                    </div>
                    <div className={validatePassword(newPassword).errors.default ? "text-red-500" : "text-green-500"}>
                      ✓ Not default password
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
