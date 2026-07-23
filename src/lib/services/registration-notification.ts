import { DocumentGenerationService } from "./document-generation";
import {
  createAndSendEmail,
  escapeHtml,
} from "./email-service";

type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  registrationIdentifier: string | null;
  studentProfile: {
    mentorshipTrack: "CAREER" | "BUSINESS" | null;
    cohort: { name: string } | null;
  } | null;
  supervisorProfile: {
    title: string | null;
    department: { name: string };
    cohortAssignments: Array<{ cohort: { name: string } }>;
  } | null;
};

const CONTACT_EMAIL = process.env.BG_HUB_CONTACT_EMAIL || "info@bghub.co.ke";
const CONTACT_PHONE = process.env.BG_HUB_CONTACT_PHONE || "+254 709 228 500";

export async function sendRegistrationNotification(user: RegisteredUser): Promise<void> {
  if (!user.registrationIdentifier || !["STUDENT", "SUPERVISOR"].includes(user.role)) {
    return;
  }

  try {
    if (user.role === "STUDENT" && user.studentProfile) {
      const track = user.studentProfile.mentorshipTrack === "BUSINESS" ? "Business Mentorship" : "Career Mentorship";
      const cohort = user.studentProfile.cohort?.name || "To be assigned";
      const document = await DocumentGenerationService.generateDocument(
        "PROVISIONAL_ADMISSION_LETTER",
        {
          recipientName: user.name,
          email: user.email,
          phoneNumber: user.phone || "Not provided",
          registrationTrack: track,
          registrationIdentifier: user.registrationIdentifier,
          paymentStatus: "Pending",
          registrationValidityHours: 24,
        },
      );

      await createAndSendEmail({
        userId: user.id,
        to: user.email,
        subject: "Provisional Admission to the BG HUB Mentorship Programme",
        html: menteeEmail(user.name, user.registrationIdentifier, track, cohort),
        attachment: { filename: document.fileName, path: document.filePath, contentType: "application/pdf" },
      });
    }

    if (user.role === "SUPERVISOR" && user.supervisorProfile) {
      const technicalArea = user.supervisorProfile.title || user.supervisorProfile.department.name;
      const cohorts = user.supervisorProfile.cohortAssignments.map(({ cohort }) => cohort.name).join(", ") || "To be assigned";
      const document = await DocumentGenerationService.generateDocument(
        "TECHNICAL_MENTOR_ENGAGEMENT_LETTER",
        {
          mentorName: user.name,
          email: user.email,
          technicalArea,
          registrationIdentifier: user.registrationIdentifier,
        },
      );

      await createAndSendEmail({
        userId: user.id,
        to: user.email,
        subject: "Letter of Engagement – BG HUB Technical Mentor",
        html: mentorEmail(user.name, technicalArea, cohorts, user.registrationIdentifier),
        attachment: { filename: document.fileName, path: document.filePath, contentType: "application/pdf" },
      });
    }
  } catch (error) {
    console.error(`Registration notification preparation failed for ${user.email}:`, error);
  }
}

function layout(title: string, content: string): string {
  return `<div style="font-family:Helvetica;line-height:1.6;color:#172033;max-width:640px"><h2>${title}</h2>${content}<p>For assistance, contact ${CONTACT_EMAIL} or ${CONTACT_PHONE}.</p><p>Regards,<br>BG HUB Consulting LTD</p></div>`;
}

function menteeEmail(name: string, identifier: string, track: string, cohort: string): string {
  return layout("Welcome to the BG HUB Mentorship Programme", `<p>Dear ${escapeHtml(name)},</p><p>Welcome. Your provisional registration has been successfully completed.</p><ul><li><strong>Registration Identifier:</strong> ${escapeHtml(identifier)}</li><li><strong>Mentorship Track:</strong> ${escapeHtml(track)}</li><li><strong>Assigned Cohort:</strong> ${escapeHtml(cohort)}</li></ul><p>Your provisional registration is valid for 24 hours. Please complete the required programme payment within this period using the payment instructions provided by BG HUB. Your registration becomes permanent after payment confirmation.</p><p>Your provisional admission letter is attached for your records.</p>`);
}

function mentorEmail(name: string, technicalArea: string, cohorts: string, identifier: string): string {
  return layout("Welcome as a BG HUB Technical Mentor", `<p>Dear ${escapeHtml(name)},</p><p>Welcome to the BG HUB Mentorship Programme. We are pleased to confirm your technical mentor registration.</p><ul><li><strong>Technical Area:</strong> ${escapeHtml(technicalArea)}</li><li><strong>Assigned Cohort(s):</strong> ${escapeHtml(cohorts)}</li><li><strong>Registration Identifier:</strong> ${escapeHtml(identifier)}</li></ul><p>Your official engagement letter is attached for your records.</p>`);
}