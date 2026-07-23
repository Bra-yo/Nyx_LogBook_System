"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface MentorOption { id: string; user: { name: string; email: string } }
interface CohortDetail {
  id: string;
  name: string;
  code: string;
  mentorshipTrack: string;
  status: string;
  description?: string | null;
  maximumCapacity: number;
  _count: { members: number; mentorAssignments: number };
  members: Array<{ id: string; user: { name: string; email: string } }>;
  mentorAssignments: Array<{ id: string; mentor: MentorOption }>;
  clickupListId?: string | null;
  clickupLastSyncedAt?: string | null;
  clickupSyncStatus?: string | null;
  clickupSyncError?: string | null;
}

export default function CohortDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [assignmentPending, setAssignmentPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", mentorshipTrack: "CAREER", status: "UPCOMING", description: "", maximumCapacity: "25" });

  const loadData = async () => {
    const response = await fetch(`/api/admin/cohorts/${params.id}`);
    const data = await response.json();
    if (data.success) {
      setCohort(data.cohort);
      setForm({
        name: data.cohort.name,
        code: data.cohort.code,
        mentorshipTrack: data.cohort.mentorshipTrack,
        status: data.cohort.status,
        description: data.cohort.description || "",
        maximumCapacity: String(data.cohort.maximumCapacity),
      });
    }
  };

  useEffect(() => {
    void loadData();
  }, [params.id]);

  useEffect(() => {
    const loadMentors = async () => {
      const response = await fetch("/api/admin/users?limit=100&role=SUPERVISOR");
      const data = await response.json();
      if (data.users) {
        setMentors(data.users.filter((user: any) => user.supervisorProfile).map((user: any) => ({ id: user.supervisorProfile.id, user: { name: user.name, email: user.email } })));
      }
    };
    void loadMentors();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch(`/api/admin/cohorts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (data.success) {
      toast.success("Cohort updated");
    } else {
      toast.error(data.error || "Unable to update cohort");
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedMentorId) {
      toast.error("Select a mentor");
      return;
    }
    setAssignmentPending(true);
    try {
      const response = await fetch(`/api/admin/cohorts/${params.id}/mentors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: selectedMentorId }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedMentorId("");
        await loadData();
        toast.success("Mentor assigned");
      } else {
        toast.error(data.error || "Unable to assign mentor");
      }
    } finally {
      setAssignmentPending(false);
    }
  };

  const handleRemoveMentor = async (supervisorId: string) => {
    setAssignmentPending(true);
    try {
      const response = await fetch(
        `/api/admin/cohorts/${params.id}/mentors?supervisorId=${encodeURIComponent(supervisorId)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (data.success) {
        await loadData();
        toast.success("Mentor removed");
      } else {
        toast.error(data.error || "Unable to remove mentor");
      }
    } finally {
      setAssignmentPending(false);
    }
  };

  const handleSync = async (scope: "cohort" | "learner", learnerId?: string) => {
    setSyncPending(true);
    try {
      const response = await fetch(`/api/admin/cohorts/${params.id}/clickup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, learnerId }) });
      const data = await response.json();
      if (!response.ok) toast.error(data.error || "ClickUp synchronization failed");
      else { await loadData(); toast.success(scope === "cohort" ? "Cohort synchronized with ClickUp" : "Learner synchronized with ClickUp"); }
    } finally { setSyncPending(false); }
  };

  if (!cohort) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <Button variant="outline" onClick={() => router.push("/admin/cohorts")}>Back to Cohorts</Button>
      <Card>
        <CardHeader><CardTitle>ClickUp Synchronization</CardTitle><CardDescription>Keep this cohort and its learners synchronized with ClickUp.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleSync("cohort")} disabled={syncPending}>{syncPending ? "Synchronizing..." : cohort.clickupListId ? "Manual Re-sync Cohort" : "Sync Cohort"}</Button>
            <span className="self-center text-sm text-muted-foreground">Status: {cohort.clickupSyncStatus || "Not synchronized"}</span>
          </div>
          {cohort.clickupLastSyncedAt && <p className="text-sm text-muted-foreground">Last Sync: {new Date(cohort.clickupLastSyncedAt).toLocaleString()}</p>}
          {cohort.clickupSyncError && <p className="text-sm text-destructive">Error Details: {cohort.clickupSyncError}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Edit Cohort</CardTitle>
          <CardDescription>Update cohort details and assign mentors.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
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
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Mentors</CardTitle>
          <CardDescription>Assign one or more mentors to this cohort.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mentor</Label>
            <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
              <SelectTrigger><SelectValue placeholder="Select a mentor" /></SelectTrigger>
              <SelectContent>
                {mentors.map((mentor) => <SelectItem key={mentor.id} value={mentor.id}>{mentor.user.name} ({mentor.user.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAssignMentor} disabled={assignmentPending}>
            {assignmentPending ? "Saving..." : "Assign Mentor"}
          </Button>
          <div className="space-y-3 border-t pt-4">
            <div>
              <h3 className="font-medium">Assigned Mentors</h3>
              <p className="text-sm text-muted-foreground">
                {cohort._count.mentorAssignments} mentor{cohort._count.mentorAssignments === 1 ? "" : "s"} assigned
              </p>
            </div>
            {cohort.mentorAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mentors assigned yet.</p>
            ) : cohort.mentorAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-4 rounded border px-3 py-2">
                <div>
                  <p className="font-medium">{assignment.mentor.user.name}</p>
                  <p className="text-sm text-muted-foreground">{assignment.mentor.user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={assignmentPending}
                  onClick={() => handleRemoveMentor(assignment.mentor.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>View all mentees currently assigned to this cohort.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {cohort.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 rounded border px-3 py-2">
              <div><span>{member.user.name}</span><p className="text-sm text-muted-foreground">{member.user.email}</p></div>
              <Button variant="outline" size="sm" disabled={syncPending || !cohort.clickupListId} onClick={() => handleSync("learner", member.id)}>Sync Learner</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
