import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import { DocumentIdentityService } from "./document-identity";

export type SupportedDocumentType =
  | "PROVISIONAL_ADMISSION_LETTER"
  | "TECHNICAL_MENTOR_ENGAGEMENT_LETTER"
  | "MENTEE_PROFILE";

export interface DocumentGenerationArtifact {
  filePath: string;
  fileName: string;
  documentType: SupportedDocumentType;
  registrationIdentifier: string;
  verificationPath: string;
  generatedTimestamp: string;
}

export interface ProvisionalAdmissionLetterPayload {
  recipientName: string;
  email: string;
  phoneNumber: string;
  registrationTrack: string;
  registrationIdentifier: string;
  generatedAt?: string;
  registrationStatus?: string;
  paymentStatus?: string;
  registrationValidityHours?: number;
}

export interface TechnicalMentorEngagementLetterPayload {
  mentorName: string;
  email: string;
  technicalArea: string;
  registrationIdentifier: string;
  generatedAt?: string;
}

export interface MenteeProfilePayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  mentorshipTrack: string;
  registrationIdentifier: string;
  registrationStatus?: string;
  paymentStatus?: string;
  dateRegistered?: string;
}

interface DocumentTemplate {
  title: string;
  subtitle: string;
  sections: Array<{
    heading?: string;
    lines: string[];
  }>;
  metadata: Array<{ label: string; value: string }>;
  footerNote: string;
}

interface TemplateContext {
  documentType: SupportedDocumentType;
  registrationIdentifier: string;
  verificationPath: string;
  generatedAt: string;
}

export class DocumentGenerationService {
  static async generateDocument<TPayload extends object>(
    documentType: SupportedDocumentType,
    payload: TPayload,
  ): Promise<DocumentGenerationArtifact> {
    const { context: templateContext, identityAssets } = await this.buildTemplateContext(
      documentType,
      payload,
    );
    const template = this.buildTemplate(documentType, payload, templateContext);

    const assetRoot = path.resolve(process.cwd(), "documents", this.toFolderName(documentType));
    await mkdir(assetRoot, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${this.toFileName(documentType)}-${timestamp}.pdf`;
    const filePath = path.join(assetRoot, fileName);

    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    await this.renderDocument(doc, template, templateContext, identityAssets);
    await writeFile(filePath, Buffer.from(doc.output("arraybuffer")));

    return {
      filePath,
      fileName,
      documentType,
      registrationIdentifier: templateContext.registrationIdentifier,
      verificationPath: templateContext.verificationPath,
      generatedTimestamp: templateContext.generatedAt,
    };
  }

  private static async buildTemplateContext<TPayload extends object>(
    documentType: SupportedDocumentType,
    payload: TPayload,
  ): Promise<{
    context: TemplateContext;
    identityAssets: Awaited<ReturnType<typeof DocumentIdentityService.generateIdentityAssets>>;
  }> {
    const registrationIdentifier = this.extractRegistrationIdentifier(payload);
    const normalizedIdentifier = DocumentIdentityService.normalizeRegistrationIdentifier(
      registrationIdentifier,
    );
    const identityAssets = await DocumentIdentityService.generateIdentityAssets(
      normalizedIdentifier,
    );

    return {
      context: {
        documentType,
        registrationIdentifier: identityAssets.registrationIdentifier,
        verificationPath: identityAssets.verificationPath,
        generatedAt: this.formatDate(this.extractGeneratedAt(payload)),
      },
      identityAssets,
    };
  }

  private static buildTemplate<TPayload extends object>(
    documentType: SupportedDocumentType,
    payload: TPayload,
    context: TemplateContext,
  ): DocumentTemplate {
    if (documentType === "PROVISIONAL_ADMISSION_LETTER") {
      return this.buildProvisionalAdmissionTemplate(
        payload as ProvisionalAdmissionLetterPayload,
        context,
      );
    }

    if (documentType === "TECHNICAL_MENTOR_ENGAGEMENT_LETTER") {
      return this.buildTechnicalMentorEngagementTemplate(
        payload as TechnicalMentorEngagementLetterPayload,
        context,
      );
    }

    return this.buildMenteeProfileTemplate(payload as MenteeProfilePayload, context);
  }

  private static buildProvisionalAdmissionTemplate(
    payload: ProvisionalAdmissionLetterPayload,
    context: TemplateContext,
  ): DocumentTemplate {
    const registrationStatus = payload.registrationStatus ?? "Provisional";
    const paymentStatus = payload.paymentStatus ?? "Pending";
    const validityHours = payload.registrationValidityHours ?? 24;

    return {
      title: "Provisional Admission Letter",
      subtitle: "Career & Business Mentorship",
      sections: [
        {
          heading: "Recipient Details",
          lines: [
            `Recipient: ${payload.recipientName}`,
            `Email: ${payload.email}`,
            `Phone: ${payload.phoneNumber}`,
          ],
        },
        {
          heading: "Registration Details",
          lines: [
            `Registration Track: ${payload.registrationTrack}`,
            `Provisional Registration Number: ${context.registrationIdentifier}`,
            `Date Generated: ${context.generatedAt}`,
          ],
        },
        {
          heading: "Admission Terms",
          lines: [
            `Registration Status: ${registrationStatus}`,
            `Payment Status: ${paymentStatus}`,
            `Registration Number valid for ${validityHours} hours before payment confirmation.`,
            "The registration number becomes permanent after successful payment.",
          ],
        },
        {
          heading: "Official Notice",
          lines: [
            "This provisional admission letter confirms the applicant's eligibility for mentorship onboarding.",
            "Please retain this document for verification and future reference.",
          ],
        },
      ],
      metadata: [
        { label: "Document Type", value: "Provisional Admission Letter" },
        { label: "Verification Path", value: context.verificationPath },
      ],
      footerNote:
        "BG HUB Consulting LTD • Official provisional admission document",
    };
  }

  private static buildTechnicalMentorEngagementTemplate(
    payload: TechnicalMentorEngagementLetterPayload,
    context: TemplateContext,
  ): DocumentTemplate {
    return {
      title: "Technical Mentor Engagement Letter",
      subtitle: "Mentorship Engagement",
      sections: [
        {
          heading: "Mentor Details",
          lines: [
            `Mentor Name: ${payload.mentorName}`,
            `Email: ${payload.email}`,
            `Technical Area: ${payload.technicalArea}`,
          ],
        },
        {
          heading: "Registration Details",
          lines: [
            `TM Registration Number: ${context.registrationIdentifier}`,
            `Date Generated: ${context.generatedAt}`,
          ],
        },
        {
          heading: "Engagement Statement",
          lines: [
            "This letter formalizes the mentor's engagement with the BG HUB mentorship programme.",
            "The mentor will provide technical guidance, supervision, and review support for assigned mentees.",
          ],
        },
      ],
      metadata: [
        { label: "Document Type", value: "Technical Mentor Engagement Letter" },
        { label: "Verification Path", value: context.verificationPath },
      ],
      footerNote: "BG HUB Consulting LTD • Official mentor engagement document",
    };
  }

  private static buildMenteeProfileTemplate(
    payload: MenteeProfilePayload,
    context: TemplateContext,
  ): DocumentTemplate {
    return {
      title: "Mentee Profile",
      subtitle: "Professional Mentorship Profile",
      sections: [
        {
          heading: "Profile Summary",
          lines: [
            `Full Name: ${payload.fullName}`,
            `Email: ${payload.email}`,
            `Phone: ${payload.phoneNumber}`,
          ],
        },
        {
          heading: "Registration Details",
          lines: [
            `Registration Number: ${context.registrationIdentifier}`,
            `Mentorship Track: ${payload.mentorshipTrack}`,
            `Date Registered: ${payload.dateRegistered ?? context.generatedAt}`,
          ],
        },
        {
          heading: "Programme Status",
          lines: [
            `Registration Status: ${payload.registrationStatus ?? "Provisional"}`,
            `Payment Status: ${payload.paymentStatus ?? "Pending"}`,
            "This profile is suitable for printing and internal record keeping.",
          ],
        },
      ],
      metadata: [
        { label: "Document Type", value: "Mentee Profile" },
        { label: "Verification Path", value: context.verificationPath },
      ],
      footerNote: "BG HUB Consulting LTD • Printable profile document",
    };
  }

  private static async renderDocument(
    doc: jsPDF,
    template: DocumentTemplate,
    context: TemplateContext,
    identityAssets: Awaited<ReturnType<typeof DocumentIdentityService.generateIdentityAssets>>,
  ): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    this.renderHeader(doc, template.title, template.subtitle);

    let y = 42;
    for (const section of template.sections) {
      if (y > pageHeight - 70) {
        doc.addPage();
        y = 24;
        this.renderHeader(doc, template.title, template.subtitle);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(section.heading ?? "Section", 20, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      for (const line of section.lines) {
        const wrappedLines = doc.splitTextToSize(line, 170);
        doc.text(wrappedLines, 24, y);
        y += 6 * wrappedLines.length;
      }

      y += 3;
    }

    y += 4;
    if (y > pageHeight - 75) {
      doc.addPage();
      y = 24;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text("Document Metadata", 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    for (const item of template.metadata) {
      const valueText = `${item.label}: ${item.value}`;
      const wrappedValue = doc.splitTextToSize(valueText, 170);
      doc.text(wrappedValue, 24, y);
      y += 6 * wrappedValue.length;
    }

    const identityY = Math.min(y + 8, pageHeight - 60);
    await this.renderIdentityBlock(
      doc,
      context.registrationIdentifier,
      context.verificationPath,
      identityY,
      identityAssets,
    );

    this.renderFooter(doc, template.footerNote, pageHeight - 12);
  }

  private static renderHeader(doc: jsPDF, title: string, subtitle: string): void {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, "F");

    const logoPath = path.resolve(process.cwd(), "public", "bob-grogan-logo.png");
    this.addImageIfPresent(doc, logoPath, 16, 3, 24, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 48, 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 48, 16);
  }

  private static renderFooter(doc: jsPDF, note: string, y: number): void {
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y - 3, doc.internal.pageSize.getWidth() - 20, y - 3);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(note, 20, y);
  }

  private static async renderIdentityBlock(
    doc: jsPDF,
    registrationIdentifier: string,
    verificationPath: string,
    y: number,
    identityAssets: Awaited<ReturnType<typeof DocumentIdentityService.generateIdentityAssets>>,
  ): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 56, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Verification & Identity", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(`Registration Identifier: ${registrationIdentifier}`, 20, y + 15);
    doc.text(`Verification Path: ${verificationPath}`, 20, y + 21);

    const qrAdded = await this.addImageBuffer(
      doc,
      identityAssets.qrCodeBuffer,
      pageWidth - 48,
      y + 8,
      24,
      24,
    );
    if (!qrAdded) {
      doc.setDrawColor(15, 23, 42);
      doc.rect(pageWidth - 48, y + 8, 24, 24);
      doc.text("QR", pageWidth - 38, y + 20);
    }

    this.drawBarcodePlaceholder(doc, registrationIdentifier, 20, y + 30, pageWidth - 40);

    if (y + 56 > pageHeight - 20) {
      doc.addPage();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Verification & Identity", 20, 24);
    }
  }

  private static drawBarcodePlaceholder(
    doc: jsPDF,
    registrationIdentifier: string,
    x: number,
    y: number,
    width: number,
  ): void {
    const charValues = Array.from(registrationIdentifier).map((character) =>
      character.charCodeAt(0) % 10,
    );

    let cursorX = x;
    const barHeight = 10;
    const moduleWidth = Math.max(1.2, width / Math.max(charValues.length * 3, 12));

    doc.setDrawColor(15, 23, 42);
    for (const value of charValues) {
      const barWidth = Math.max(1, moduleWidth * (value + 1));
      doc.rect(cursorX, y, barWidth, barHeight, "F");
      cursorX += barWidth + 0.6;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(registrationIdentifier, x, y + 20);
  }

  private static async addImageIfPresent(
    doc: jsPDF,
    imagePath: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<boolean> {
    try {
      const imageBuffer = await readFile(imagePath);
      return this.addImageBuffer(doc, imageBuffer, x, y, width, height);
    } catch {
      return false;
    }
  }

  private static addImageBuffer(
    doc: jsPDF,
    imageBuffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean {
    try {
      const imageData = imageBuffer.toString("base64");
      const mimeType = imageBuffer.subarray(0, 8).toString("hex").includes("89504e470d0a1a0a")
        ? "image/png"
        : "image/jpeg";
      doc.addImage(
        `data:${mimeType};base64,${imageData}`,
        mimeType === "image/png" ? "PNG" : "JPEG",
        x,
        y,
        width,
        height,
      );
      return true;
    } catch {
      return false;
    }
  }

  private static detectMimeType(imagePath: string): string {
    const extension = path.extname(imagePath).toLowerCase();
    if (extension === ".png") {
      return "image/png";
    }

    if (extension === ".jpg" || extension === ".jpeg") {
      return "image/jpeg";
    }

    return "image/png";
  }

  private static extractRegistrationIdentifier<TPayload extends object>(payload: TPayload): string {
    const maybe = payload as Record<string, unknown>;
    const value = maybe.registrationIdentifier;
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    return "TM-KE-00001";
  }

  private static extractGeneratedAt<TPayload extends object>(payload: TPayload): string {
    const maybe = payload as Record<string, unknown>;
    const value = maybe.generatedAt ?? maybe.dateRegistered;
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    return new Date().toISOString().split("T")[0] ?? "2026-07-22";
  }

  private static formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toISOString().split("T")[0] ?? value;
  }

  private static toFolderName(documentType: SupportedDocumentType): string {
    return documentType.toLowerCase().replace(/_/g, "-");
  }

  private static toFileName(documentType: SupportedDocumentType): string {
    return documentType.toLowerCase().replace(/_/g, "-");
  }
}
