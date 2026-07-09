import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface WorkerLogbookEntryPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerLogbookEntryPage({
  params,
}: WorkerLogbookEntryPageProps) {
  const { id } = await params;

  const res = await fetch(`/api/worker/logbook/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <DashboardLayout title="Entry not found">
        <div className="py-24 text-center">
          <h3 className="text-xl font-semibold">Entry not found</h3>
          <p className="text-muted-foreground mt-2">
            The requested work record could not be found.
          </p>
          <div className="mt-4">
            <Link href="/worker/logbook">
              <Button>Back to WorkLog</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const data = await res.json();
  const entry = data.entry;

  return (
    <DashboardLayout title={entry?.title || "Work Record"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{entry.title}</h2>
            <p className="text-muted-foreground">
              {new Date(entry.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href={`/worker/logbook/${entry.id}/edit`}>
              <Button>Edit</Button>
            </Link>
            <Link href="/worker/logbook">
              <Button variant="ghost">Close</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <h4 className="text-lg font-medium">Description</h4>
              <p>{entry.description}</p>

              <h4 className="text-lg font-medium mt-4">Activities</h4>
              <p>{entry.activities}</p>

              {entry.challenges && (
                <>
                  <h4 className="text-lg font-medium mt-4">Challenges</h4>
                  <p>{entry.challenges}</p>
                </>
              )}

              {entry.learnings && (
                <>
                  <h4 className="text-lg font-medium mt-4">Learnings</h4>
                  <p>{entry.learnings}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
