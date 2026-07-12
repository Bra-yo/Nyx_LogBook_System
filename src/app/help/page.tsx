"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoleCard } from "@/components/help/role-card";
import { GuideSection } from "@/components/help/guide-section";
import { ScreenshotCard } from "@/components/help/screenshot-card";
import { FAQItem } from "@/components/help/faq-item";
import { SearchGuide } from "@/components/help/search-guide";
import { PrintGuide } from "@/components/help/print-guide";
import {
  BookOpen,
  GraduationCap,
  Users,
  BriefcaseBusiness,
  ShieldCheck,
  ArrowLeft,
  LogIn,
  Menu,
  Sparkles,
  CircleHelp,
  ChevronRight,
} from "lucide-react";

const roleConfigs = [
  {
    key: "student",
    title: "Student",
    description: "Create, manage and submit internship logbooks.",
    icon: GraduationCap,
    hero: "Student Guide",
    overview:
      "Use your student guide to create entries, submit weekly work, review milestone progress, and stay updated on supervisor feedback.",
    sections: [
      {
        title: "Overview",
        description:
          "This workspace helps you capture your daily work and keep your supervisor informed.",
        steps: [
          {
            title: "Create a reliable record",
            description:
              "Add work entries regularly so your progress is visible and easy to review.",
          },
          {
            title: "Stay engaged",
            description:
              "Check milestones, notifications, and comments often so you never miss guidance.",
          },
        ],
        tips: [
          "Keep entries specific and time-based for better reviews.",
          "Submit weekly work before the deadline to avoid delays.",
        ],
        mistakes: [
          "Submitting vague entries without clear outcomes.",
          "Waiting until the last minute to review feedback.",
        ],
      },
      {
        title: "How to Sign Up",
        description:
          "Your account is usually created by the administrator or your placement coordinator.",
        steps: [
          {
            title: "Receive access",
            description:
              "Confirm that your account has been issued by the administrator.",
          },
          {
            title: "Set your password",
            description:
              "Use the temporary credentials provided and change your password on first sign in. The default password is ChangeMe123.",
          },
        ],
        tips: ["Use an email address you check regularly."],
        mistakes: [
          "Trying to create a student account yourself when access is managed centrally.",
        ],
      },
      {
        title: "How to Sign In",
        description:
          "Sign in from the main portal using your registered email and password.",
        steps: [
          {
            title: "Open the sign-in page",
            description: "Go to the login screen from the landing page.",
          },
          {
            title: "Enter credentials",
            description: "Type your email and password, then press Sign In.",
          },
          {
            title: "Access your dashboard",
            description:
              "You will land on your student workspace after a successful login.",
          },
        ],
        tips: [
          "Use the password visibility option if you are unsure whether your password was entered correctly.",
        ],
        mistakes: [
          "Typing the wrong email address or using an outdated password.",
        ],
      },
      {
        title: "Dashboard Overview",
        description:
          "The dashboard gives you a quick view of work activity and pending tasks.",
        steps: [
          {
            title: "Check your current status",
            description: "Review your latest entries and upcoming milestones.",
          },
          {
            title: "View notifications",
            description:
              "Open the notifications area to see recent updates from supervisors or administrators.",
          },
        ],
        tips: ["Treat the dashboard as your daily command center."],
        mistakes: ["Ignoring milestones or unread notifications."],
      },
      {
        title: "Main Features",
        description:
          "Use the student tools for logging, reviewing, and tracking your work.",
        steps: [
          {
            title: "Create logbook entries",
            description: "Record tasks, outcomes, and supporting details.",
          },
          {
            title: "Manage milestones",
            description:
              "Track key milestones linked to your placement or project.",
          },
          {
            title: "Review feedback",
            description: "Read comments and updates left by your supervisor.",
          },
        ],
        tips: ["Attach relevant notes when an entry needs extra context."],
        mistakes: ["Forgetting to submit weekly work after entering details."],
      },
      {
        title: "Step-by-step instructions",
        description: "Follow these steps to maintain your worklog efficiently.",
        steps: [
          {
            title: "Open the logbook",
            description: "Navigate to the logbook area from your dashboard.",
          },
          {
            title: "Add a new entry",
            description:
              "Select New Entry and complete the record with your activity and outcome.",
          },
          {
            title: "Submit weekly work",
            description:
              "Use the weekly submission option when your planned work is complete.",
          },
          {
            title: "Review feedback",
            description:
              "Open supervisor comments and act on them where needed.",
          },
        ],
        tips: ["Save a draft if you need more time before submission."],
        mistakes: ["Leaving required fields blank."],
      },
      {
        title: "Frequently Asked Questions",
        description: "Common questions from student users.",
        steps: [
          {
            title: "How do I recover access?",
            description:
              "Use the sign-in recovery flow or contact the system administrator.",
          },
          {
            title: "Who reviews my work?",
            description:
              "Your assigned supervisor reviews the entries and weekly submissions.",
          },
        ],
        tips: ["Check your notifications for reminders and approval updates."],
        mistakes: ["Assuming feedback is only provided in email."],
      },
    ],
    faq: [
      {
        question: "I forgot my password.",
        answer:
          "Use the password reset option on the sign-in page or contact the administrator for account support.",
      },
      {
        question: "Who approves my work?",
        answer:
          "Your assigned supervisor reviews and approves your submitted work and milestone updates.",
      },
      {
        question: "Who creates my account?",
        answer:
          "Accounts are usually created and managed by the administrator or placement coordinator.",
      },
    ],
  },
  {
    key: "worker",
    title: "Worker",
    description: "Record attendance and manage assigned work.",
    icon: BriefcaseBusiness,
    hero: "Worker Guide",
    overview:
      "The worker guide helps you check in, view attendance history, and stay updated on your daily work tasks.",
    sections: [
      {
        title: "Overview",
        description:
          "Workers use the system for attendance, work logging, and profile visibility.",
        steps: [
          {
            title: "Check in and out",
            description:
              "Use the attendance tools to mark your arrival and departure.",
          },
          {
            title: "Review your history",
            description:
              "Open attendance records to verify your working hours and punctuality.",
          },
        ],
        tips: [
          "Check in at the start of your shift so your attendance is accurate.",
        ],
        mistakes: ["Forgetting to check out at the end of your shift."],
      },
      {
        title: "How to Sign In",
        description:
          "Workers sign in from the main portal using their company credentials.",
        steps: [
          {
            title: "Go to the login screen",
            description: "Open the sign-in page from the landing page.",
          },
          {
            title: "Enter credentials",
            description:
              "Use your work email and password to access the portal.",
          },
        ],
      },
      {
        title: "Dashboard Overview",
        description:
          "The dashboard shows attendance tools, profile access, and your current work context.",
        steps: [
          {
            title: "View your dashboard",
            description:
              "Open the main workspace to see your responsibilities for the day.",
          },
          {
            title: "Use attendance tools",
            description:
              "Check in, check out, and view attendance records directly from the dashboard.",
          },
        ],
      },
      {
        title: "Main Features",
        description:
          "Workers can manage attendance, profile settings, and task visibility.",
        steps: [
          {
            title: "Attendance check-in",
            description: "Record your arrival using the check-in flow.",
          },
          {
            title: "Attendance check-out",
            description: "Complete your check-out when your shift ends.",
          },
          {
            title: "View profile",
            description:
              "Open your profile to confirm your details and update contact information when necessary.",
          },
        ],
      },
      {
        title: "Step-by-step instructions",
        description: "Follow this workflow for a smooth day of work.",
        steps: [
          {
            title: "Sign in",
            description: "Open the portal and enter your credentials.",
          },
          {
            title: "Check in",
            description:
              "Use your attendance check-in button when you begin work.",
          },
          {
            title: "Work through your tasks",
            description:
              "Review your work details and updates in the dashboard.",
          },
          {
            title: "Check out",
            description: "Confirm your end-of-shift attendance before leaving.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Why can't I check in?",
        answer:
          "Check that your account is active, that you have the correct role, and that your attendance session is still open.",
      },
      {
        question: "How do I contact the administrator?",
        answer:
          "Use the contact details provided by your organization or the administrator support desk.",
      },
    ],
  },
  {
    key: "supervisor",
    title: "Supervisor",
    description: "Review student submissions and provide feedback.",
    icon: Users,
    hero: "Supervisor Guide",
    overview:
      "Supervisors use this guide to review student progress, provide feedback, and approve work confidently.",
    sections: [
      {
        title: "Overview",
        description:
          "Supervisors monitor assigned work, review submissions, and guide performance.",
        steps: [
          {
            title: "Review submissions",
            description:
              "Open new work submissions and evaluate them against expectations.",
          },
          {
            title: "Provide timely feedback",
            description:
              "Leave clear comments that help students improve quickly.",
          },
        ],
      },
      {
        title: "How to Sign In",
        description:
          "Use your supervisor credentials to access the review workspace.",
        steps: [
          {
            title: "Open the login screen",
            description: "Go to the portal sign-in page.",
          },
          {
            title: "Enter your details",
            description: "Use your assigned supervisor email and password.",
          },
        ],
      },
      {
        title: "Main Features",
        description:
          "Review, comment, approve, and generate reports for assigned students.",
        steps: [
          {
            title: "View assigned students",
            description: "Open the student list to see current assignments.",
          },
          {
            title: "Review submissions",
            description: "Inspect submitted work and milestone updates.",
          },
          {
            title: "Write comments",
            description: "Leave guided feedback to support next steps.",
          },
          {
            title: "Approve work",
            description:
              "Confirm that a submission meets the required standard.",
          },
        ],
      },
      {
        title: "Step-by-step instructions",
        description: "Use this flow when supporting student progress.",
        steps: [
          {
            title: "Open the student list",
            description: "Select the student you want to review.",
          },
          {
            title: "Check their submissions",
            description: "Review the latest work and any milestone updates.",
          },
          {
            title: "Add comments",
            description: "Leave clear guidance and next actions.",
          },
          {
            title: "Approve or request revision",
            description:
              "Complete the review with an approval or revision request.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Who approves my work?",
        answer:
          "Your assigned supervisor is responsible for reviewing and approving your work submissions.",
      },
      {
        question: "How do I contact the administrator?",
        answer:
          "Use the administrator contact path or your internal support contacts.",
      },
    ],
  },
  {
    key: "lecturer",
    title: "Lecturer",
    description: "Assess milestones and monitor student progress.",
    icon: BookOpen,
    hero: "Lecturer Guide",
    overview:
      "Lecturers use this guide to review student progress, assessment outcomes, and academic reports.",
    sections: [
      {
        title: "Overview",
        description:
          "This guide helps lecturers review student development and academic performance.",
        steps: [
          {
            title: "Review milestones",
            description: "Check milestone progress for each student.",
          },
          {
            title: "Assess project work",
            description:
              "Review submitted project details and associated evidence.",
          },
        ],
      },
      {
        title: "How to Sign In",
        description:
          "Access the lecturer workspace with your academic credentials.",
        steps: [
          {
            title: "Open the login page",
            description: "Go to the general sign-in page.",
          },
          {
            title: "Enter your lecturer account details",
            description: "Use your registered email and password.",
          },
        ],
      },
      {
        title: "Main Features",
        description:
          "Use the lecturer workspace for milestone review, projects, assessments, and reports.",
        steps: [
          {
            title: "Review milestones",
            description: "Check student progress and identify risks early.",
          },
          {
            title: "Review projects",
            description:
              "Open ongoing project records and assess their quality.",
          },
          {
            title: "Manage assessments",
            description:
              "Record assessment outcomes and provide academic guidance.",
          },
          {
            title: "View reports",
            description: "Generate or consult reports for student performance.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "How do I contact the administrator?",
        answer:
          "Use the support channel from your department or the administrator contact route.",
      },
      {
        question: "Who approves my work?",
        answer:
          "Supervisors review student work while lecturers assess academic progression and outcomes.",
      },
    ],
  },
  {
    key: "admin",
    title: "Administrator",
    description: "Manage users, departments, projects and system settings.",
    icon: ShieldCheck,
    hero: "Administrator Guide",
    overview:
      "Administrators use the system to manage access, worker records, departments, locations, reports, audit logs, and platform settings.",
    sections: [
      {
        title: "Overview",
        description:
          "The administration workspace is the control center for the platform.",
        steps: [
          {
            title: "Manage users",
            description:
              "Create and maintain student, supervisor, lecturer, worker, and admin accounts.",
          },
          {
            title: "Maintain configuration",
            description:
              "Keep departments, locations, projects, and settings aligned with your operations.",
          },
        ],
      },
      {
        title: "How to Sign In",
        description:
          "Administrators sign in with the central administrator account.",
        steps: [
          {
            title: "Open the login page",
            description: "Go to the sign-in screen from the landing page.",
          },
          {
            title: "Enter administrator credentials",
            description: "Use your administrator email and password.",
          },
        ],
      },
      {
        title: "Main Features",
        description:
          "Administrators manage the full system configuration and operational visibility.",
        steps: [
          {
            title: "Manage users",
            description: "Create, update, and review user accounts.",
          },
          {
            title: "Sync workers",
            description:
              "Keep workforce records aligned with the connected systems.",
          },
          {
            title: "Manage departments and locations",
            description: "Organize your teams and physical places.",
          },
          {
            title: "Manage projects",
            description: "Configure project structures and related milestones.",
          },
          {
            title: "View reports and audit logs",
            description: "Monitor activity and maintain compliance.",
          },
        ],
      },
      {
        title: "Step-by-step instructions",
        description: "Use this checklist to maintain the platform effectively.",
        steps: [
          {
            title: "Open the administration area",
            description: "Select the admin workspace from the dashboard.",
          },
          {
            title: "Review user accounts",
            description:
              "Check that all users have the correct role and access.",
          },
          {
            title: "Maintain departments and locations",
            description: "Ensure the team structure remains up to date.",
          },
          {
            title: "Review system reports",
            description: "Use reports and logs for oversight and support.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "How do I contact the administrator?",
        answer:
          "Use the support contact configured for your organization or the admin contact details in the system.",
      },
      {
        question: "Why can't I log in?",
        answer:
          "Verify your credentials, ensure your account is active, and confirm there are no password or role-based access issues.",
      },
    ],
  },
];

const allSections = roleConfigs.flatMap((role) =>
  role.sections.map((section) => ({
    roleKey: role.key,
    roleTitle: role.title,
    sectionTitle: section.title,
    description: section.description,
  })),
);

export default function HelpPage() {
  const [selectedRole, setSelectedRole] = useState("student");
  const [query, setQuery] = useState("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const selectedRoleConfig =
    roleConfigs.find((role) => role.key === selectedRole) ?? roleConfigs[0];

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return selectedRoleConfig.sections;

    return selectedRoleConfig.sections.filter((section) => {
      const haystack =
        `${section.title} ${section.description} ${section.steps.map((step) => step.title).join(" ")} ${section.steps.map((step) => step.description).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, selectedRoleConfig]);

  const filteredFaq = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return selectedRoleConfig.faq;
    return selectedRoleConfig.faq.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, selectedRoleConfig]);

  const tocItems = allSections.filter((section) => {
    if (section.roleKey !== selectedRole) return false;

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return `${section.sectionTitle} ${section.description}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const printableContent = selectedRoleConfig.sections
    .map(
      (section) =>
        `<h2>${section.title}</h2>${section.steps.map((step) => `<p><strong>${step.title}</strong> — ${step.description}</p>`).join("")}`,
    )
    .join("");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <LogIn className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileTocOpen(true)}
              className="lg:hidden"
            >
              <Menu className="mr-2 h-4 w-4" />
              Contents
            </Button>
            <PrintGuide
              title={`${selectedRoleConfig.title} Guide`}
              overview={selectedRoleConfig.overview}
              content={printableContent}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4 rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Guide contents</h2>
            </div>
            <div className="space-y-2">
              {tocItems.map((item) => (
                <a
                  key={`${item.roleKey}-${item.sectionTitle}`}
                  href={`#${item.roleKey}-${item.sectionTitle}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span>
                    {item.roleTitle} · {item.sectionTitle}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              In-app support center
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Bob Grogan Worklog management System User Guide
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Select your role to view the appropriate guide.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchGuide value={query} onChange={setQuery} />
              <div className="rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                {selectedRoleConfig.title} guide active
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {roleConfigs.map((role) => (
              <RoleCard
                key={role.key}
                title={role.title}
                description={role.description}
                icon={role.icon}
                active={selectedRole === role.key}
                onClick={() => {
                  setSelectedRole(role.key);
                  setQuery("");
                }}
              />
            ))}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">
                    Selected guide
                  </p>
                  <h2 className="text-2xl font-semibold">
                    {selectedRoleConfig.hero}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedRoleConfig.overview}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {filteredSections.map((section) => (
                <div
                  key={`${selectedRole}-${section.title}`}
                  id={`${selectedRole}-${section.title}`}
                >
                  <GuideSection
                    icon={selectedRoleConfig.icon}
                    title={section.title}
                    description={section.description}
                    steps={section.steps}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-2xl font-semibold">
                Frequently asked questions
              </h3>
            </div>
            <div className="space-y-3">
              {filteredFaq.map((item) => (
                <FAQItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        style={{ display: mobileTocOpen ? "block" : "none" }}
        onClick={() => setMobileTocOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r bg-background p-4 shadow-xl transition-transform lg:hidden ${mobileTocOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Guide contents</h3>
          <button
            type="button"
            onClick={() => setMobileTocOpen(false)}
            className="rounded-md p-2 hover:bg-accent"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {tocItems.map((item) => (
            <a
              key={`mobile-${item.roleKey}-${item.sectionTitle}`}
              href={`#${item.roleKey}-${item.sectionTitle}`}
              onClick={() => setMobileTocOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <span>
                {item.roleTitle} · {item.sectionTitle}
              </span>
              <ChevronRight className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
