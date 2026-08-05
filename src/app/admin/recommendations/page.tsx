"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecommendationItem {
  id: string;
  learningPath: {
    id: string;
    learnerId: string;
    competencyId: string;
    competency?: { name: string; code: string };
  };
  mentor: { id: string; user: { name: string | null } };
  status: string;
  allocationReason: string;
  notes?: string | null;
}

interface MentorOption {
  id: string;
  user: { name: string | null };
}

export default function AdminRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allocationsResponse, mentorsResponse] = await Promise.all([
          fetch("/api/admin/learner-mentor-allocations"),
          fetch("/api/admin/users"),
        ]);
        const allocationsData = await allocationsResponse.json();
        const mentorsData = await mentorsResponse.json();
        if (allocationsData.success) {
          setRecommendations(allocationsData.learnerMentorAllocations ?? []);
        }
        if (mentorsData.users) {
          setMentors(
            (mentorsData.users as any[])
              .filter((user: any) => user.role === "SUPERVISOR")
              .map((user: any) => ({
                id: user.supervisorProfile?.id ?? user.id,
                user: { name: user.name },
              })),
          );
        }
      } catch (error) {
        console.error("Failed to load recommendations", error);
        toast.error("Unable to load mentor recommendations");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const updateRecommendation = async (recommendationId: string, mentorId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/learner-mentor-allocations/${recommendationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, status, allocationReason: status === "ACTIVE" ? "MANUAL_ASSIGNMENT" : "AUTO_MATCH" }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update recommendation");
      }

      setRecommendations((current) => current.map((item) => (item.id === recommendationId ? { ...item, mentor: { ...item.mentor, id: mentorId }, status } : item)));
      toast.success("Recommendation updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update recommendation");
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10 text-muted-foreground">Loading recommendations…</div>;
  }

  return (
    <div className="container mx-auto max-w-5xl py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Admin review</p>
        <h1 className="text-3xl font-semibold">Mentor recommendation review</h1>
        <p className="text-muted-foreground">Accept recommendations, reassign eligible mentors, or leave a path unassigned for later review.</p>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No recommendations found yet.</CardContent>
        </Card>
      ) : (
        recommendations.map((recommendation) => {
          const competencyName = recommendation.learningPath?.competency?.name ?? "Learning path";
          const competencyCode = recommendation.learningPath?.competency?.code ?? recommendation.learningPath?.competencyId ?? "N/A";
          const mentorName = recommendation.mentor?.user?.name ?? "Pending";
          const mentorId = recommendation.mentor?.id ?? "";

          return (
            <Card key={recommendation.id}>
              <CardHeader>
                <CardTitle>{competencyName}</CardTitle>
                <CardDescription>{competencyCode} • Suggested mentor: {mentorName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign mentor</label>
                    <Select value={mentorId} onValueChange={(value) => updateRecommendation(recommendation.id, value, recommendation.status)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mentor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mentors.map((mentor) => (
                          <SelectItem key={mentor.id} value={mentor.id}>{mentor.user.name ?? mentor.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review action</label>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => updateRecommendation(recommendation.id, mentorId || recommendation.mentor?.id || "", "PENDING")}>Keep pending</Button>
                      <Button onClick={() => updateRecommendation(recommendation.id, mentorId || recommendation.mentor?.id || "", "ACTIVE")}>Approve</Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Status: {recommendation.status} • Reason: {recommendation.allocationReason}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
