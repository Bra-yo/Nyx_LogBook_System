import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  GraduationCap,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";
import { BRANDING } from "@/lib/branding";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-end px-6">
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="mx-auto mb-8 flex h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
            <Image
              src="/bob-grogan-logo.png"
              alt="Bob Grogan Consulting LTD Logo"
              width={180}
              height={56}
              className="mx-auto h-24 w-auto sm:h-32 md:h-40 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            WorkLog
            <span className="block text-primary">Management System</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive platform for users to manage work records, real-time
            tracking, and assessments.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Role-Based Features</h2>
          <p className="text-xl text-muted-foreground">
            Tailored experiences for every user type
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Learners</CardTitle>
              <CardDescription>
                Submit daily/weekly logs, track progress, and receive feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 text-muted-foreground">
                <li>• Create and manage work records</li>
                <li>• Upload attachments and documents</li>
                <li>• View supervisor comments</li>
                <li>• Track work progress</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Supervisors</CardTitle>
              <CardDescription>
                Review student entries and provide valuable feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 text-muted-foreground">
                <li>• Review and approve entries</li>
                <li>• Add comments and ratings</li>
                <li>• Track student progress</li>
                <li>• Generate reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lecturers</CardTitle>
              <CardDescription>
                Assess student performance and provide academic guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 text-muted-foreground">
                <li>• Grade student performance</li>
                <li>• Add assessment scores</li>
                <li>• Provide academic feedback</li>
                <li>• Generate reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BriefcaseBusiness className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Workers</CardTitle>
              <CardDescription>
                Check in with QR codes, manage daily work logs, and track assigned tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-left space-y-2 text-muted-foreground">
                <li>• Check in and out with QR codes</li>
                <li>• Maintain daily work records</li>
                <li>• Track assigned tasks and outputs</li>
                <li>• Sync work records with ERP systems</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-6 py-24">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="px-12 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to streamline your internship management?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join teams using {BRANDING.appName}
            </p>
            <Link href="/auth/signin">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Using {BRANDING.appName}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>{BRANDING.footerText}</p>
            <p className="mt-2">Premium WorkLog Management Solution</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
