"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CircleHelp } from "lucide-react";
import Link from "next/link";
import { BRANDING } from "@/lib/branding";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const message = typeof result.error === "string" ? result.error : "Invalid email or password";
        setError(message);
      } else if (result?.ok) {
        const session = await getSession();
        if (session) {
          const roleRedirects = {
            SUPERVISOR: "/supervisor",
            LECTURER: "/lecturer",
            ADMIN: "/admin",
            WORKER: "/worker",
          };

          if (session.user.role === "STUDENT") {
            const onboardingResponse = await fetch("/api/student/onboarding");
            const onboardingData = await onboardingResponse.json().catch(() => ({}));
            if (onboardingResponse.ok && onboardingData.success && !onboardingData.studentProfile?.onboardingCompleted) {
              router.push("/student/onboarding");
              return;
            }
          }

          router.push(
            roleRedirects[session.user.role as keyof typeof roleRedirects] ||
              "/student",
          );
        }
      }
    } catch (error) {
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center min-w-0">
              <Image
                src="/bghub-logo-black.jpeg"
                alt="BGHUB Kenya Logo"
                width={180}
                height={56}
                className="object-contain h-10 w-auto sm:h-12 md:h-20"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome to BGHUB Kenya WorkLog</h1>
          <p className="text-muted-foreground">
            Sign in to your learning workspace
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your learning workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 flex flex-col items-center gap-2 text-sm">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <CircleHelp className="h-4 w-4" />
                Help Center
              </Link>
              <div>
                <span className="text-muted-foreground">
                  Don't have an account?
                </span>{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary hover:underline"
                >
                  Contact your administrator
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
