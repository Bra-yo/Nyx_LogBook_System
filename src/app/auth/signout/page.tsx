"use client"

import { useEffect } from "react"
import { signOut, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ redirect: false })
      router.push("/auth/signin")
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-lg font-medium">Signing out...</p>
        <p className="text-sm text-muted-foreground">You will be redirected shortly</p>
      </div>
    </div>
  )
}
