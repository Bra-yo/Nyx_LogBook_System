"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LogStatus } from "@/types";
import {
  getLogbookDisplayStatus,
  getStatusBadgeProps,
} from "@/lib/logbook-status";

interface LogbookEntry {
  id: string;
  title: string;
  description: string;
  activities: string;
  challenges?: string;
  learnings?: string;
  date: string;
  status: LogStatus;
  reviewerComment?: string;
  reviewedAt?: string;
}

interface LogbookResponse {
  entries: LogbookEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface WorkLogbookPageProps {
  layoutTitle?: string;
  heading?: string;
  description?: string;
  createHref?: string;
  entryBasePath: string;
  entriesApiPath: string;
  attendanceApiPath?: string;
  attendanceRedirectHref?: string;
  requiresAttendance?: boolean;
}

const getStatusBadge = (entry: LogbookEntry) => {
  const displayStatus = getLogbookDisplayStatus(entry);
  const badgeProps = getStatusBadgeProps(displayStatus);
  return <Badge className={badgeProps.className}>{badgeProps.label}</Badge>;
};

export function WorkLogbookPage({
  layoutTitle = "WorkLog Records",
  heading = "WorkLog Records",
  description = "Manage your daily and weekly work records",
  createHref,
  entryBasePath,
  entriesApiPath,
  attendanceApiPath = "/api/attendance/active",
  attendanceRedirectHref,
  requiresAttendance = false,
}: WorkLogbookPageProps) {
  const [logbookEntries, setLogbookEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LogStatus | "all">("all");
  const [checkingAttendance, setCheckingAttendance] =
    useState(requiresAttendance);
  const router = useRouter();

  const fetchLogbookEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(entriesApiPath);
      if (response.ok) {
        const data: LogbookResponse = await response.json();
        setLogbookEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching logbook entries:", error);
      setLogbookEntries([]);
    } finally {
      setLoading(false);
    }
  }, [entriesApiPath]);

  const checkAttendanceAndFetchEntries = useCallback(async () => {
    try {
      if (requiresAttendance) {
        setCheckingAttendance(true);

        const attendanceResponse = await fetch(attendanceApiPath);
        const attendanceData = await attendanceResponse.json();

        if (!attendanceData.hasAttendanceToday) {
          router.push(
            attendanceRedirectHref ||
              `${entryBasePath}?redirect=${entryBasePath}`,
          );
          return;
        }
      }

      await fetchLogbookEntries();
    } catch (error) {
      console.error("Error checking attendance:", error);
      await fetchLogbookEntries();
    } finally {
      setCheckingAttendance(false);
    }
  }, [
    attendanceApiPath,
    attendanceRedirectHref,
    entryBasePath,
    requiresAttendance,
    router,
    fetchLogbookEntries,
  ]);

  useEffect(() => {
    const id = setTimeout(() => {
      void checkAttendanceAndFetchEntries();
    }, 0);
    return () => clearTimeout(id);
  }, [checkAttendanceAndFetchEntries]);

  const filteredEntries = logbookEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || entry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (checkingAttendance) {
    return (
      <DashboardLayout title={layoutTitle}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={layoutTitle}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                {heading}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            {createHref ? (
              <Link href={createHref} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Work Record
                </Button>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Work Records
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  logbookEntries.length
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Current records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-green-600">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  logbookEntries.filter(
                    (entry) => entry.status === LogStatus.APPROVED,
                  ).length
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Reviewed entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-yellow-600">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  logbookEntries.filter(
                    (entry) => entry.status === LogStatus.PENDING,
                  ).length
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Awaiting feedback
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-gray-600">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-muted" />
                ) : (
                  logbookEntries.filter(
                    (entry) => entry.status === LogStatus.DRAFT,
                  ).length
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Search by title, description, or status to narrow down your
              records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Filter className="mr-2 h-4 w-4" />
                      {filterStatus === "all"
                        ? "All Status"
                        : filterStatus === LogStatus.APPROVED
                          ? "Approved"
                          : filterStatus === LogStatus.PENDING
                            ? "Pending Review"
                            : filterStatus === LogStatus.REJECTED
                              ? "Rejected"
                              : filterStatus === LogStatus.DRAFT
                                ? "Draft"
                                : filterStatus}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setFilterStatus(LogStatus.APPROVED)}
                    >
                      Approved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus(LogStatus.PENDING)}
                    >
                      Pending Review
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus(LogStatus.REJECTED)}
                    >
                      Rejected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilterStatus(LogStatus.DRAFT)}
                    >
                      Draft
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="rounded-xl border border-muted/50 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                  {filteredEntries.length}{" "}
                  {filteredEntries.length === 1 ? "record" : "records"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
            <CardDescription>
              {loading
                ? "Loading entries..."
                : `${filteredEntries.length} ${filteredEntries.length === 1 ? "entry" : "entries"} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No work records found.
                {createHref ? (
                  <>
                    <br />
                    <Link
                      href={createHref}
                      className="text-primary hover:underline"
                    >
                      Create your first entry
                    </Link>
                  </>
                ) : null}
              </div>
            ) : (
              <Table className="overflow-hidden rounded-xl border border-muted/50">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {entry.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(entry.date)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(entry)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {entry.reviewerComment ? (
                            <>
                              <span>Reviewed</span>
                              <span className="truncate">
                                {entry.reviewerComment}
                              </span>
                            </>
                          ) : (
                            <span>No reviewer notes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`${entryBasePath}/${entry.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {entry.status === LogStatus.DRAFT ? (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`${entryBasePath}/${entry.id}/edit`}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
