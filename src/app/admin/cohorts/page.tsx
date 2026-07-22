"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Users, UserRoundCheck, Archive, PlayCircle, Eye } from "lucide-react";

interface CohortAssignment {
  id: string;
  mentor: { user: { name: string; email: string } };
}

interface CohortRecord {
  id: string;
  name: string;
  code: string;
  mentorshipTrack: string;
  status: string;
  description?: string | null;
  maximumCapacity: number;
  _count: { members: number; mentorAssignments: number };
  mentorAssignments: CohortAssignment[];
}

export default function AdminCohortsPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    mentorshipTrack: "CAREER",
    status: "UPCOMING",
    description: "",
    maximumCapacity: "25",
  });
  const [loading, setLoading] = useState(true);

  const loadCohorts = async () => {
    const response = await fetch("/api/admin/cohorts");
    const data = await response.json();
    if (data.success) {
      setCohorts(data.cohorts);
    }
  };

  useEffect(() => {
    void loadCohorts().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/admin/cohorts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (data.success) {
      toast.success("Cohort created");
      setForm({ name: "", code: "", mentorshipTrack: "CAREER", status: "UPCOMING", description: "", maximumCapacity: "25" });
      await loadCohorts();
    } else {
      toast.error(data.error || "Unable to create cohort");
    }
  };

  const handleToggleStatus = async (cohort: CohortRecord, status: string) => {
    const response = await fetch(`/api/admin/cohorts/${cohort.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (data.success) {
      toast.success("Cohort updated");
      await loadCohorts();
    } else {
      toast.error(data.error || "Unable to update cohort");
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cohort Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage mentorship cohorts and assigned mentors.</p>
        </div>
        <Button onClick={() => router.push("/admin")}>Back to Dashboard</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Cohort</CardTitle>
          <CardDescription>Create a new mentorship cohort with capacity and track details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Mentorship Track</Label>
              <Select value={form.mentorshipTrack} onValueChange={(value) => setForm({ ...form, mentorshipTrack: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAREER">Career</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Maximum Capacity</Label>
              <Input type="number" value={form.maximumCapacity} onChange={(event) => setForm({ ...form, maximumCapacity: event.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto"><Plus className="mr-2 h-4 w-4" />Create Cohort</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading cohorts...</p>
        ) : cohorts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cohorts yet.</p>
        ) : (
          cohorts.map((cohort) => {
            const availableSlots = Math.max(0, cohort.maximumCapacity - cohort._count.members);
            return (
              <Card key={cohort.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{cohort.name}</CardTitle>
                      <CardDescription>{cohort.code} · {cohort.mentorshipTrack}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/cohorts/${cohort.id}`)}><Eye className="mr-2 h-4 w-4" />View</Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus(cohort, cohort.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED")}>{cohort.status === "ARCHIVED" ? <PlayCircle className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}{cohort.status === "ARCHIVED" ? "Activate" : "Archive"}</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">Status: {cohort.status}</span>
                    <span className="rounded-full bg-muted px-3 py-1">Capacity: {cohort._count.members}/{cohort.maximumCapacity}</span>
                    <span className="rounded-full bg-muted px-3 py-1">Available Slots: {availableSlots}</span>
                    <span className="rounded-full bg-muted px-3 py-1">Assigned Mentors: {cohort._count.mentorAssignments}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm"><Users className="mr-2 h-4 w-4" />{cohort._count.members} members</span>
                    <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm"><UserRoundCheck className="mr-2 h-4 w-4" />{cohort.mentorAssignments.length} mentors</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
