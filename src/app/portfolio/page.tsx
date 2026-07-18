"use client";

import Image from "next/image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Briefcase,
  CalendarDays,
  Clock3,
  Edit3,
  FileText,
  Link2,
  Mail,
  Phone,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Upload,
  UserCircle2,
} from "lucide-react";

interface PortfolioCertificate {
  name: string;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

interface PortfolioResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar?: string | null;
    role: string;
    bio?: string | null;
    skills: string[];
    certificates?: PortfolioCertificate[];
    socialLinks: Record<string, string>;
    company?: string | null;
    department?: string | null;
    roleTitle?: string | null;
  };
  summary: {
    projectsCompleted: number;
    activeProjects: number;
    tasksCompleted: number;
    tasksPending: number;
    worklogsSubmitted: number;
    totalHoursWorked: number;
    weeklyProductivity: number;
    monthlyProductivity: number;
    completionRate: number;
  };
  achievements: Array<{ title: string; detail: string }>;
  timeline: Array<{ title: string; date: string; type: string }>;
  charts: {
    weeklyHours: Array<{ label: string; totalHours: number }>;
    monthlyHours: Array<{ label: string; totalHours: number }>;
    monthlyTasks: Array<{ label: string; completed: number }>;
    productivityTrend: Array<{ label: string; value: number }>;
  };
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const portfolioRef = useRef<HTMLDivElement | null>(null);
  const [certificates, setCertificates] = useState<PortfolioCertificate[]>([]);

  const normalizeStringArray = (value: unknown): string[] => {
    // Safely convert any value to a string array, never null/undefined
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) return [];

    return value
      .filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const normalizeCertificates = (value: unknown): PortfolioCertificate[] => {
    // Safely convert any value to a certificate array, never null/undefined
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) return [];

    return value
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
      .map((item) => ({
        name: typeof item.name === "string" ? item.name.trim() : "",
        type: typeof item.type === "string" ? item.type.trim() : "",
        dataUrl: typeof item.dataUrl === "string" ? item.dataUrl.trim() : "",
        uploadedAt:
          typeof item.uploadedAt === "string" && item.uploadedAt.length > 0
            ? item.uploadedAt
            : new Date().toISOString(),
      }))
      .filter((item) => Boolean(item.name && item.dataUrl));
  };

  const normalizeSocialLinks = (value: unknown): Record<string, string> => {
    // Safely convert any value to a social links object, never null/undefined
    if (value === null || value === undefined) return {};
    if (typeof value !== "object" || Array.isArray(value)) return {};

    try {
      return Object.entries(value as Record<string, unknown>).reduce(
        (acc, [key, entry]) => {
          if (typeof entry === "string" && entry.trim().length > 0) {
            acc[key] = entry.trim();
          }
          return acc;
        },
        {} as Record<string, string>,
      );
    } catch {
      return {};
    }
  };

  const normalizePortfolioResponse = (data: unknown): PortfolioResponse => {
    const payload = (data ?? {}) as Partial<PortfolioResponse> & {
      user?: Record<string, unknown>;
      charts?: Record<string, unknown>;
      summary?: Record<string, unknown>;
    };

    const user = (payload.user ?? {}) as Record<string, unknown>;
    const summary = (payload.summary ?? {}) as Record<string, unknown>;
    const charts = (payload.charts ?? {}) as Record<string, unknown>;

    const normalizedAchievements = Array.isArray(payload.achievements)
      ? payload.achievements.filter(
          (item): item is { title: string; detail: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { title?: unknown }).title === "string" &&
            typeof (item as { detail?: unknown }).detail === "string",
        )
      : [];

    const normalizedTimeline = Array.isArray(payload.timeline)
      ? payload.timeline.filter(
          (item): item is { title: string; date: string; type: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { title?: unknown }).title === "string" &&
            typeof (item as { date?: unknown }).date === "string" &&
            typeof (item as { type?: unknown }).type === "string",
        )
      : [];

    return {
      user: {
        id: typeof user.id === "string" ? user.id : "",
        name: typeof user.name === "string" ? user.name : "",
        email: typeof user.email === "string" ? user.email : "",
        phone: typeof user.phone === "string" ? user.phone : null,
        avatar: typeof user.avatar === "string" ? user.avatar : null,
        role: typeof user.role === "string" ? user.role : "USER",
        bio: typeof user.bio === "string" ? user.bio : null,
        skills: normalizeStringArray(user.skills),
        certificates: normalizeCertificates(user.certificates),
        socialLinks: normalizeSocialLinks(user.socialLinks),
        company: typeof user.company === "string" ? user.company : null,
        department:
          typeof user.department === "string" ? user.department : null,
        roleTitle: typeof user.roleTitle === "string" ? user.roleTitle : null,
      },
      summary: {
        projectsCompleted:
          typeof (summary.projectsCompleted as unknown) === "number"
            ? (summary.projectsCompleted as number)
            : 0,
        activeProjects:
          typeof (summary.activeProjects as unknown) === "number"
            ? (summary.activeProjects as number)
            : 0,
        tasksCompleted:
          typeof (summary.tasksCompleted as unknown) === "number"
            ? (summary.tasksCompleted as number)
            : 0,
        tasksPending:
          typeof (summary.tasksPending as unknown) === "number"
            ? (summary.tasksPending as number)
            : 0,
        worklogsSubmitted:
          typeof (summary.worklogsSubmitted as unknown) === "number"
            ? (summary.worklogsSubmitted as number)
            : 0,
        totalHoursWorked:
          typeof (summary.totalHoursWorked as unknown) === "number"
            ? (summary.totalHoursWorked as number)
            : 0,
        weeklyProductivity:
          typeof (summary.weeklyProductivity as unknown) === "number"
            ? (summary.weeklyProductivity as number)
            : 0,
        monthlyProductivity:
          typeof (summary.monthlyProductivity as unknown) === "number"
            ? (summary.monthlyProductivity as number)
            : 0,
        completionRate:
          typeof (summary.completionRate as unknown) === "number"
            ? (summary.completionRate as number)
            : 0,
      },
      achievements: normalizedAchievements,
      timeline: normalizedTimeline,
      charts: {
        weeklyHours: Array.isArray(charts.weeklyHours as unknown)
          ? (charts.weeklyHours as unknown[]).filter(
              (item): item is { label: string; totalHours: number } =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as { label?: unknown }).label === "string" &&
                typeof (item as { totalHours?: unknown }).totalHours ===
                  "number",
            )
          : [],
        monthlyHours: Array.isArray(charts.monthlyHours as unknown)
          ? (charts.monthlyHours as unknown[]).filter(
              (item): item is { label: string; totalHours: number } =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as { label?: unknown }).label === "string" &&
                typeof (item as { totalHours?: unknown }).totalHours ===
                  "number",
            )
          : [],
        monthlyTasks: Array.isArray(charts.monthlyTasks as unknown)
          ? (charts.monthlyTasks as unknown[]).filter(
              (item): item is { label: string; completed: number } =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as { label?: unknown }).label === "string" &&
                typeof (item as { completed?: unknown }).completed === "number",
            )
          : [],
        productivityTrend: Array.isArray(charts.productivityTrend as unknown)
          ? (charts.productivityTrend as unknown[]).filter(
              (item): item is { label: string; value: number } =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as { label?: unknown }).label === "string" &&
                typeof (item as { value?: unknown }).value === "number",
            )
          : [],
      },
    };
  };

  const loadPortfolio = async () => {
    try {
      const response = await fetch("/api/portfolio");
      if (!response.ok) throw new Error("Failed to load portfolio");
      const rawData = await response.json();
      const data = normalizePortfolioResponse(rawData);

      setPortfolio(data);
      // Always use normalize functions to ensure safe arrays/objects
      const safeBio = typeof data.user.bio === "string" ? data.user.bio : "";
      const safeSkills = Array.isArray(data.user.skills)
        ? data.user.skills
        : [];
      const safeSocialLinks =
        data.user.socialLinks &&
        typeof data.user.socialLinks === "object" &&
        !Array.isArray(data.user.socialLinks)
          ? data.user.socialLinks
          : {};
      const safeCertificates = Array.isArray(data.user.certificates)
        ? data.user.certificates
        : [];

      setBio(safeBio);
      setSkills(safeSkills);
      setSocialLinks(safeSocialLinks);
      setCertificates(safeCertificates);
    } catch (error) {
      console.error(error);
      // Set safe defaults on error
      setBio("");
      setSkills([]);
      setSocialLinks({});
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Valid async data fetching pattern - setState is called in fetch callbacks
    // eslint-disable-next-line
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      // Ensure all data is properly typed before sending
      const payload = {
        bio: typeof bio === "string" ? bio.trim() || undefined : undefined,
        skills: Array.isArray(skills) ? skills : [],
        certificates: Array.isArray(certificates) ? certificates : [],
        socialLinks:
          socialLinks &&
          typeof socialLinks === "object" &&
          !Array.isArray(socialLinks)
            ? socialLinks
            : {},
      };

      const response = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save portfolio");
      await loadPortfolio();
      setEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      void handleSave();
      return;
    }
    setEditing(true);
  };

  const handleDownloadPdf = async () => {
    if (!portfolioRef.current) return;

    const canvas = await html2canvas(portfolioRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${portfolio?.user.name || "portfolio"}-portfolio.pdf`);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    setSkills((prev) => {
      // Ensure prev is always an array
      const safeArray = Array.isArray(prev) ? prev : [];
      if (!safeArray.includes(trimmed)) {
        return [...safeArray, trimmed];
      }
      return safeArray;
    });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => {
      // Ensure prev is always an array
      const safeArray = Array.isArray(prev) ? prev : [];
      return safeArray.filter((item) => item !== skill);
    });
  };

  const handleCertificateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCertificates((prev) => {
        // Ensure prev is always an array
        const safeArray = Array.isArray(prev) ? prev : [];
        return [
          ...safeArray,
          {
            name: file.name,
            type: file.type,
            dataUrl: result,
            uploadedAt: new Date().toISOString(),
          },
        ];
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const updateSocialLink = (key: string, value: string) => {
    setSocialLinks((prev) => {
      // Ensure prev is always a valid object
      const safePrev =
        prev && typeof prev === "object" && !Array.isArray(prev) ? prev : {};
      return { ...safePrev, [key]: value };
    });
  };

  const summaryCards = useMemo(() => {
    if (!portfolio) return [];
    const { summary } = portfolio;
    return [
      {
        label: "Projects completed",
        value: summary.projectsCompleted.toString(),
        icon: Briefcase,
      },
      {
        label: "Active projects",
        value: summary.activeProjects.toString(),
        icon: Sparkles,
      },
      {
        label: "Tasks completed",
        value: summary.tasksCompleted.toString(),
        icon: Star,
      },
      {
        label: "Tasks pending",
        value: summary.tasksPending.toString(),
        icon: Clock3,
      },
      {
        label: "Worklogs submitted",
        value: summary.worklogsSubmitted.toString(),
        icon: FileText,
      },
      {
        label: "Total hours worked",
        value: `${summary.totalHoursWorked}h`,
        icon: CalendarDays,
      },
      {
        label: "Weekly productivity",
        value: `${summary.weeklyProductivity.toFixed(1)}h`,
        icon: Sparkles,
      },
      {
        label: "Monthly productivity",
        value: `${summary.monthlyProductivity.toFixed(1)}h`,
        icon: Briefcase,
      },
      {
        label: "Completion rate",
        value: `${summary.completionRate}%`,
        icon: Trophy,
      },
    ];
  }, [portfolio]);

  if (loading) {
    return (
      <DashboardLayout title="My Portfolio">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-56 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-24 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!portfolio) {
    return (
      <DashboardLayout title="My Portfolio">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Unable to load your portfolio right now.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Portfolio">
      <div ref={portfolioRef} className="space-y-6 print-space">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Professional Portfolio</h2>
            <p className="text-sm text-muted-foreground">
              A polished summary of your work, skill growth, and achievements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="mr-2 h-4 w-4" />
              Print Portfolio
            </Button>
            <Button variant="outline" onClick={() => void handleDownloadPdf()}>
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleEditToggle}>
              {editing ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Edit3 className="mr-2 h-4 w-4" />
              )}
              {editing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border border-border/60 bg-linear-to-br from-primary/10 via-background to-background print-card">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-primary">
              {portfolio.user.avatar ? (
                <Image
                  src={portfolio.user.avatar}
                  alt={portfolio.user.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <UserCircle2 className="h-16 w-16" />
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold">
                  {portfolio.user.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {portfolio.user.roleTitle || portfolio.user.role}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {portfolio.user.department ? (
                  <Badge variant="secondary">{portfolio.user.department}</Badge>
                ) : null}
                {portfolio.user.company ? (
                  <Badge variant="outline">{portfolio.user.company}</Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {portfolio.user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {portfolio.user.phone || "—"}
                </span>
              </div>
              {editing ? (
                <Textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Write a short professional bio..."
                  className="min-h-24"
                />
              ) : (
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {bio ||
                    "A professional summary will appear here as you add more activity to the system."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((item) => (
            <Card key={item.label} className="print-card">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="print-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Skills
            </CardTitle>
            <CardDescription>
              Highlight your strengths and update them anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(skills) ? skills : []).map((skill) => (
                <Badge key={skill} className="gap-2 rounded-full px-3 py-2">
                  {skill}
                  {editing ? (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </Badge>
              ))}
            </div>
            {editing ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Add a skill"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === "Enter" &&
                    (event.preventDefault(), addSkill())
                  }
                />
                <Button variant="outline" onClick={addSkill}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add skill
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="print-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                Automatically generated from your recent activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Array.isArray(portfolio.achievements)
                ? portfolio.achievements
                : []
              ).map((achievement) => (
                <div key={achievement.title} className="rounded-lg border p-3">
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {achievement.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="print-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Timeline
              </CardTitle>
              <CardDescription>
                A chronological view of your progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Array.isArray(portfolio.timeline)
                ? portfolio.timeline
                : []
              ).map((entry) => (
                <div
                  key={`${entry.title}-${entry.date}`}
                  className="rounded-lg border p-3"
                >
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="print-card">
            <CardHeader>
              <CardTitle>Weekly hours</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    Array.isArray(portfolio.charts.weeklyHours)
                      ? portfolio.charts.weeklyHours
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="totalHours"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="print-card">
            <CardHeader>
              <CardTitle>Productivity trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    Array.isArray(portfolio.charts.productivityTrend)
                      ? portfolio.charts.productivityTrend
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="print-card">
            <CardHeader>
              <CardTitle>Monthly hours</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    Array.isArray(portfolio.charts.monthlyHours)
                      ? portfolio.charts.monthlyHours
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="totalHours"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="print-card">
            <CardHeader>
              <CardTitle>Tasks completed per month</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    Array.isArray(portfolio.charts.monthlyTasks)
                      ? portfolio.charts.monthlyTasks
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#f59e0b"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="print-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificates and documents
            </CardTitle>
            <CardDescription>
              Upload proof of achievements, awards, and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-muted/40">
                <Upload className="h-4 w-4" />
                <span>Upload certificate or recommendation letter</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                  onChange={handleCertificateUpload}
                />
              </label>
            ) : null}
            {(Array.isArray(certificates) ? certificates : []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {(Array.isArray(certificates) ? certificates : []).map(
                  (certificate) => (
                    <div
                      key={`${certificate.name}-${certificate.uploadedAt}`}
                      className="rounded-lg border p-3"
                    >
                      <p className="font-medium">{certificate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(certificate.uploadedAt).toLocaleDateString()}
                      </p>
                      <a
                        href={certificate.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-primary"
                      >
                        <FileText className="h-4 w-4" />
                        View file
                      </a>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Professional links
            </CardTitle>
            <CardDescription>
              Share GitHub, LinkedIn, and other relevant profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {editing ? (
              <>
                <Input
                  placeholder="LinkedIn"
                  value={socialLinks.linkedin ?? ""}
                  onChange={(event) =>
                    updateSocialLink("linkedin", event.target.value)
                  }
                />
                <Input
                  placeholder="GitHub"
                  value={socialLinks.github ?? ""}
                  onChange={(event) =>
                    updateSocialLink("github", event.target.value)
                  }
                />
                <Input
                  placeholder="Portfolio"
                  value={socialLinks.portfolio ?? ""}
                  onChange={(event) =>
                    updateSocialLink("portfolio", event.target.value)
                  }
                />
                <Input
                  placeholder="Research"
                  value={socialLinks.research ?? ""}
                  onChange={(event) =>
                    updateSocialLink("research", event.target.value)
                  }
                />
              </>
            ) : (
              Object.entries(
                socialLinks &&
                  typeof socialLinks === "object" &&
                  !Array.isArray(socialLinks)
                  ? socialLinks
                  : {},
              )
                .filter(
                  ([, value]) => typeof value === "string" && value.length > 0,
                )
                .map(([key, value]) => (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border p-3 text-sm font-medium text-primary"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </a>
                ))
            )}
          </CardContent>
        </Card>

        {editing ? (
          <div className="flex justify-end no-print">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
