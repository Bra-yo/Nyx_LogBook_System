"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LearningPathItem {
  id: string;
  competency: { id: string; name: string; code: string };
  status: string;
  mentorAllocations: Array<{ id: string; status: string; mentor: { user: { name: string | null } } }>;
}

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [assignedLearningArea, setAssignedLearningArea] = useState<{ id: string; name: string; code: string } | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    biography: "",
    careerInterests: "",
    preferredCommunication: "",
    emergencyContact: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const onboardingResponse = await fetch("/api/student/onboarding");
        const onboardingData = await onboardingResponse.json();

        if (onboardingData.success) {
          setLearningPaths(onboardingData.learningPaths ?? []);
          setAssignedLearningArea(onboardingData.studentProfile?.learningArea ?? null);
          if (onboardingData.studentProfile?.onboardingCompleted) {
            router.replace("/student");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding state", error);
        toast.error("Unable to load onboarding details");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [router]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to generate recommendations");
      }

      setLearningPaths(data.learningPaths ?? []);
      toast.success("Your learning plan and mentor suggestions are ready");
      router.push("/student");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate recommendations");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10 text-muted-foreground">Loading your setup…</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">First-time setup</p>
        <h1 className="text-3xl font-semibold">Welcome to your learning journey</h1>
        <p className="text-muted-foreground">Your learning area is assigned by the administrator. Review the assigned programme below and continue to your onboarding recommendations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned learning area</CardTitle>
          <CardDescription>This programme was assigned by an administrator and is read-only during onboarding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignedLearningArea ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-lg font-semibold">{assignedLearningArea.name}</p>
              <p className="text-sm text-muted-foreground">{assignedLearningArea.code}</p>
              <p className="mt-2 text-sm text-muted-foreground">Assigned by Administrator</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No assigned learning area is available yet.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredCommunication">Preferred communication</Label>
              <Input
                id="preferredCommunication"
                value={formData.preferredCommunication}
                onChange={(event) => setFormData((current) => ({ ...current, preferredCommunication: event.target.value }))}
                placeholder="Email, WhatsApp, Phone"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="biography">Biography</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(event) => setFormData((current) => ({ ...current, biography: event.target.value }))}
                placeholder="Share a short introduction about your goals and experience."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="careerInterests">Career interests</Label>
              <Input
                id="careerInterests"
                value={formData.careerInterests}
                onChange={(event) => setFormData((current) => ({ ...current, careerInterests: event.target.value }))}
                placeholder="AI, Web Development, Data Science"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergencyContact">Emergency contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(event) => setFormData((current) => ({ ...current, emergencyContact: event.target.value }))}
                placeholder="Name and contact details"
              />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSaving || !assignedLearningArea}>
            {isSaving ? "Generating recommendations…" : "Continue"}
          </Button>
        </CardContent>
      </Card>

      {learningPaths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your learning paths</CardTitle>
            <CardDescription>Recommendations are created automatically and can be reviewed by an administrator before final allocation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {learningPaths.map((learningPath) => (
              <div key={learningPath.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{learningPath.competency.name}</p>
                    <p className="text-sm text-muted-foreground">{learningPath.competency.code}</p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{learningPath.status}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {learningPath.mentorAllocations.length > 0 ? learningPath.mentorAllocations.map((allocation) => (
                    <div key={allocation.id} className="text-sm text-muted-foreground">
                      Suggested mentor: {allocation.mentor.user.name ?? "Pending review"}
                    </div>
                  )) : (
                    <div className="text-sm text-muted-foreground">No mentor recommendation yet.</div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        Need help? Visit <Link href="/help" className="text-primary underline">the help center</Link>.
      </div>
    </div>
  );
}
