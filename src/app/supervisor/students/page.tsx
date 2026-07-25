"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Mail,
  Building,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { RiskBadge } from "@/components/supervisor/mentorship-performance-card";

interface Student {
  id: string;
  regNumber: string;
  year: number;
  semester: number;
  internshipCompany?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  user: {
    id: string;
    name: string;
    email: string;
    registrationIdentifier?: string | null;
    paymentStatus: string;
    accountStatus: string;
  };
  department?: {
    name: string;
    code: string;
  };
  cohort?: { id: string; name: string; code: string; status: string; mentorshipTrack?: string | null };
  supervisor?: {
    user: {
      name: string;
    };
  };
  lecturer?: {
    user: {
      name: string;
    };
  };
  performance?: {
    attendancePercentage: number;
    taskCompletionPercentage: number;
    worklogCompletionPercentage: number;
    competencyProgressPercentage: number;
    overallProgress: number;
    riskStatus: string;
  };
  _count: {
    logbookEntries: number;
    attendanceRecords: number;
  };
}

export default function SupervisorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("name");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      try {
        const response = await fetch("/api/supervisor/students?limit=100");
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setStudents(data.students || []);
          }
        } else {
          console.error("Failed to fetch students:", response.status);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return students
      .filter((student) => {
        const departmentName = student.department?.name.toLowerCase() || "";
        return (
          student.user.name.toLowerCase().includes(search) ||
          student.user.email.toLowerCase().includes(search) ||
          student.regNumber.toLowerCase().includes(search) ||
          departmentName.includes(search)
        );
      })
      .filter((student) => cohortFilter === "all" || student.cohort?.id === cohortFilter)
      .filter((student) => statusFilter === "all" || student.user.accountStatus === statusFilter)
      .sort((left, right) => {
        if (sort === "cohort") {
          return (left.cohort?.name || "").localeCompare(right.cohort?.name || "");
        }
        if (sort === "progress") {
          return (right._count.logbookEntries + right._count.attendanceRecords) - (left._count.logbookEntries + left._count.attendanceRecords);
        }
        return left.user.name.localeCompare(right.user.name);
      });
  }, [cohortFilter, searchTerm, sort, statusFilter, students]);

  const cohorts = useMemo(
    () => Array.from(new Map(students.filter((student) => student.cohort).map((student) => [student.cohort!.id, student.cohort!])).values()),
    [students],
  );

  if (loading) {
    return (
      <DashboardLayout title="Students">
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Learners">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Learners</h2>
            <p className="text-muted-foreground">
              View and manage learner profiles under your mentorship
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {filteredStudents.length} Learners
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Search students by name, email, registration number, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            />
          </div>
          <select value={cohortFilter} onChange={(event) => setCohortFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All cohorts</option>{cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All account statuses</option><option value="ACTIVE">Active</option><option value="PENDING_PAYMENT">Pending payment</option><option value="SUSPENDED">Suspended</option></select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="name">Sort: Name</option><option value="cohort">Sort: Cohort</option><option value="progress">Sort: Progress</option></select>
        </div>

        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {students.length === 0
                  ? "No students found"
                  : "No students match your search"}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0
                  ? "No students are currently registered in the system."
                  : "Try adjusting your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredStudents.map((student) => (
              <Link key={student.id} href={`/supervisor/learners/${student.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <UserRound className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{student.user.name}</CardTitle>
                          <CardDescription className="text-sm">{student.regNumber}</CardDescription>
                        </div>
                      </div>
                      {student.performance ? <RiskBadge status={student.performance.riskStatus} /> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{student.cohort?.name || "No cohort"}</Badge>
                      <Badge variant="outline">{student.cohort?.mentorshipTrack || "Track pending"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{student.user.email}</span>
                      </div>
                      {student.department ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>{student.department.name}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded border p-3">
                        <p className="text-xs uppercase text-muted-foreground">Attendance</p>
                        <p className="mt-1 text-lg font-semibold">{student.performance?.attendancePercentage ?? 0}%</p>
                      </div>
                      <div className="rounded border p-3">
                        <p className="text-xs uppercase text-muted-foreground">Tasks</p>
                        <p className="mt-1 text-lg font-semibold">{student.performance?.taskCompletionPercentage ?? 0}%</p>
                      </div>
                      <div className="rounded border p-3">
                        <p className="text-xs uppercase text-muted-foreground">Worklogs</p>
                        <p className="mt-1 text-lg font-semibold">{student.performance?.worklogCompletionPercentage ?? 0}%</p>
                      </div>
                      <div className="rounded border p-3">
                        <p className="text-xs uppercase text-muted-foreground">Competency</p>
                        <p className="mt-1 text-lg font-semibold">{student.performance?.competencyProgressPercentage ?? 0}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-sm text-muted-foreground">
                      <span>Overall progress {student.performance?.overallProgress ?? 0}%</span>
                      <span>{student.user.accountStatus}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
