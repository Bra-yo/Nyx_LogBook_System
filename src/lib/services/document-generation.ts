import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import chromiumBinary from "@sparticuz/chromium";
import { DocumentIdentityService } from "./document-identity";
import { documentStyles } from "./document-styles";

export type SupportedDocumentType = "PROVISIONAL_ADMISSION_LETTER" | "TECHNICAL_MENTOR_ENGAGEMENT_LETTER" | "MENTEE_PROFILE";
export interface DocumentGenerationArtifact { filePath: string; fileName: string; documentType: SupportedDocumentType; registrationIdentifier: string; verificationPath: string; generatedTimestamp: string; }
export interface ProvisionalAdmissionLetterPayload { recipientName: string; email: string; phoneNumber: string; registrationTrack: string; registrationIdentifier: string; generatedAt?: string; registrationStatus?: string; paymentStatus?: string; registrationValidityHours?: number; }
export interface TechnicalMentorEngagementLetterPayload { mentorName: string; email: string; technicalArea: string; registrationIdentifier: string; generatedAt?: string; }
export interface MenteeProfilePayload { fullName: string; email: string; phoneNumber: string; mentorshipTrack: string; registrationIdentifier: string; registrationStatus?: string; paymentStatus?: string; dateRegistered?: string; }
interface TemplateContext { documentType: SupportedDocumentType; registrationIdentifier: string; verificationPath: string; generatedAt: string; }
type IdentityAssets = Awaited<ReturnType<typeof DocumentIdentityService.generateIdentityAssets>>;

type IdentityView = {
  registrationIdentifier: string;
  verificationPath: string;
  qrDataUri: string;
  barcodeDataUri: string;
};

export class DocumentGenerationService {
  static async generateDocument<TPayload extends object>(documentType: SupportedDocumentType, payload: TPayload): Promise<DocumentGenerationArtifact> {
    const { context, identityAssets } = await this.buildTemplateContext(documentType, payload);
    const html = await this.buildHtml(documentType, payload, context, identityAssets);
    const assetRoot = path.resolve(process.cwd(), "documents", this.toFolderName(documentType));
    await mkdir(assetRoot, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${this.toFileName(documentType)}-${timestamp}.pdf`;
    const filePath = path.join(assetRoot, fileName);
    let browser;

try {
  browser = await this.createBrowser();

  const page = await browser.newPage({
    viewport: {
      width: 1200,
      height: 1600,
    },
  });

  await page.setContent(html, {
    waitUntil: "networkidle",
  });

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    },
  });
} finally {
  if (browser) {
    await browser.close();
  }
}

    return {
      filePath,
      fileName,
      documentType,
      registrationIdentifier: context.registrationIdentifier,
      verificationPath: context.verificationPath,
      generatedTimestamp: context.generatedAt,
    };
  }

  private static async createBrowser() {
  // Dynamically import Playwright so it isn't eagerly loaded
  // during server startup or bundling.
  const { chromium } = await import("playwright-core");

  const isVercelRuntime =
    process.env.VERCEL === "1" ||
    process.env.VERCEL === "true";

  if (isVercelRuntime) {
    return chromium.launch({
      executablePath: await chromiumBinary.executablePath(),
      args: chromiumBinary.args,
      headless: true,
    });
  }

  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_PATH ??
    process.env.CHROME_BIN ??
    process.env.CHROMIUM_BIN;

  if (executablePath) {
    return chromium.launch({
      executablePath,
      headless: true,
      args: [],
    });
  }

  return chromium.launch({
    channel: "chrome",
    headless: true,
    args: [],
  });
}

  private static async buildTemplateContext<TPayload extends object>(documentType: SupportedDocumentType, payload: TPayload): Promise<{ context: TemplateContext; identityAssets: IdentityAssets }> {
    const normalizedIdentifier = DocumentIdentityService.normalizeRegistrationIdentifier(this.extractRegistrationIdentifier(payload));
    const identityAssets = await DocumentIdentityService.generateIdentityAssets(normalizedIdentifier);

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

  private static async buildHtml<TPayload extends object>(documentType: SupportedDocumentType, payload: TPayload, context: TemplateContext, assets: IdentityAssets): Promise<string> {
    let logoDataUri: string | undefined;
    try {
      const buffer = await readFile(path.resolve(process.cwd(), "public", "bob-grogan-logo.png"));
      logoDataUri = `data:image/png;base64,${buffer.toString("base64")}`;
    } catch {
      logoDataUri = undefined;
    }

    const identity: IdentityView = {
      registrationIdentifier: context.registrationIdentifier,
      verificationPath: context.verificationPath,
      qrDataUri: `data:${assets.qrCodeMimeType};base64,${assets.qrCodeBuffer.toString("base64")}`,
      barcodeDataUri: `data:${assets.barcodeMimeType};base64,${assets.barcodeBuffer.toString("base64")}`,
    };

    const body = documentType === "PROVISIONAL_ADMISSION_LETTER"
      ? this.renderAdmissionDocument(payload as ProvisionalAdmissionLetterPayload, context, identity, logoDataUri)
      : documentType === "TECHNICAL_MENTOR_ENGAGEMENT_LETTER"
        ? this.renderMentorDocument(payload as TechnicalMentorEngagementLetterPayload, context, identity, logoDataUri)
        : this.renderProfileDocument(payload as MenteeProfilePayload, context, identity, logoDataUri);

    return `<!doctype html><html><head><meta charset="utf-8"><style>${documentStyles}</style></head><body>${body}</body></html>`;
  }

  private static renderAdmissionDocument(payload: ProvisionalAdmissionLetterPayload, context: TemplateContext, identity: IdentityView, logoDataUri?: string): string {
    const validityHours = payload.registrationValidityHours ?? 24;
    const reference = this.buildDocumentReference({
      documentType: "PROVISIONAL_ADMISSION_LETTER",
      registrationIdentifier: context.registrationIdentifier,
      generatedAt: context.generatedAt,
    });

    return `<main class="document">${this.renderHeader(reference, `Date: ${context.generatedAt}`, "Provisional admission", logoDataUri)}<div class="document-hero"><p class="eyebrow">Official programme correspondence</p><h1>Provisional Admission to the BGHUB Mentorship Programme</h1><p class="hero-note">Issued to ${this.escapeHtml(payload.recipientName)} | Registration status: Provisional</p></div>${this.renderSection("Recipient", this.renderInformationCard([
      { label: "Name", value: payload.recipientName },
      { label: "Email", value: payload.email },
      { label: "Phone", value: payload.phoneNumber },
    ]))}${this.renderSection("Admission notice", `<p class="prose">Dear ${this.escapeHtml(payload.recipientName)},</p><p class="prose">We are pleased to inform you that your application to join the BGHUB Mentorship Programme has been provisionally accepted, subject to payment of the prescribed registration fee.</p><p class="prose">You have been allocated the following Provisional Registration Number, which also serves as your payment account number for registration purposes.</p>`) }${this.renderSection("Registration and payment", this.renderInformationCard([
      { label: "Provisional registration number", value: context.registrationIdentifier },
      { label: "Track", value: payload.registrationTrack },
      { label: "Payment status", value: "Pending" },
      { label: "Registration fee", value: "Ksh 1,000 (one-time)" },
      { label: "Validity", value: `${validityHours} hours from issuance` },
    ]))}${this.renderSection("Payment instructions", `<p class="prose"><strong>Pay via M-PESA Paybill</strong><br />Business Name: Bob Grogan Consulting Ltd<br />Paybill Number: 4148891<br />Account Number: Your Provisional Registration Number (Example: CM-KE-00025 or BM-KE-00018)</p><p class="prose">Kindly ensure that the Account Number entered during payment exactly matches your provisional registration number.</p><p class="prose"><strong>Pay via Bank</strong><br />Business Name: Bob Grogan Consulting Ltd<br />KCB Bank, Account Number 1317224973, Machakos Branch</p>`) }${this.renderSection("Confirmation of admission", `<p class="prose">Upon successful receipt and verification of your registration payment:</p><ul class="legal-list"><li>Your provisional registration number shall become your permanent BGHUB Registration Number.</li><li>Your admission shall be formally confirmed.</li><li>An Official Letter of Admission will be sent to your registered email address.</li><li>You will receive instructions for onboarding, orientation, and access to the BGHUB Learning and Mentorship Platform.</li></ul>`) }${this.renderSection("Important information", `<ul class="legal-list"><li>The provisional registration number remains valid for 24 hours only.</li><li>If payment is not received within this period, the provisional registration shall automatically lapse and the number may be reassigned to another applicant.</li><li>Any subsequent application shall be processed as a new application.</li><li>Registration fees are non-refundable once admission has been confirmed.</li></ul>`) }${this.renderVerificationPanel(identity)}${this.renderFooter(context.verificationPath)}</main>`;
  }

  private static renderMentorDocument(payload: TechnicalMentorEngagementLetterPayload, context: TemplateContext, identity: IdentityView, logoDataUri?: string): string {
    const duties = [
      "Develop competency-based curriculums for various levels of competency",
      "Participate in curriculum review and programme improvement initiatives.",
      "Provide technical guidance to assigned mentees.",
      "Develop individualized competency development plans.",
      "Deliver structured mentorship sessions physically or virtually.",
      "Guide trainees in workplace assignments and practical projects.",
      "Supervise research, innovation, and entrepreneurship projects where applicable.",
      "Review reports, assignments, business plans, proposals, and other technical outputs.",
      "Conduct competency assessments and provide constructive feedback.",
      "Monitor trainee progress against established learning milestones.",
      "Prepare mentorship reports and submit them within stipulated timelines.",
      "Support networking and linkage of trainees to industry opportunities.",
      "Participate in technical seminars, webinars, conferences, and workshops organized by BGHUB.",
      "Promote innovation, ethical conduct, professionalism, and continuous learning.",
    ];
    const expectations = [
      "Maintain regular communication with assigned trainees.",
      "Complete agreed mentorship sessions.",
      "Meet all reporting deadlines.",
      "Respond to trainee enquiries promptly.",
      "Maintain accurate mentorship records.",
      "Demonstrate professionalism and ethical conduct.",
      "Support trainees in achieving competency-based learning outcomes.",
      "Contribute to continuous improvement of the mentorship programme.",
    ];

    const reference = this.buildDocumentReference({
      documentType: "TECHNICAL_MENTOR_ENGAGEMENT_LETTER",
      registrationIdentifier: context.registrationIdentifier,
      generatedAt: context.generatedAt,
    });

    return `<main class="document">${this.renderHeader(reference, `Date: ${context.generatedAt}`, "Technical mentor engagement", logoDataUri)}<div class="document-hero"><p class="eyebrow">Professional engagement</p><h1>Letter of Engagement as a Technical Mentor</h1><p class="hero-note">Issued to ${this.escapeHtml(payload.mentorName)} | ${this.escapeHtml(payload.technicalArea)}</p></div>${this.renderSection("Recipient", `${this.renderInformationCard([
      { label: "Name", value: payload.mentorName },
      { label: "Email", value: payload.email },
      { label: "Registration number", value: context.registrationIdentifier },
    ])}<p class="prose" style="margin-top: 12px;">Dear ${this.escapeHtml(payload.mentorName)},</p>`) }${this.renderSection("Engagement statement", `<p class="prose">On behalf of Bob Grogan Consulting Ltd, I am pleased to engage you as a Technical Mentor at BGHUB Kenya, a division of Bob Grogan Consulting Ltd.</p><p class="prose">BGHUB exists to develop highly competent professionals through structured workplace learning, technical mentorship, research, innovation, entrepreneurship, and digital transformation. As a Technical Mentor, you will play a strategic role in nurturing talent and preparing trainees for productive careers and professional practice.</p><p class="prose">This letter sets out the terms and conditions of your engagement.</p>`) }${this.renderClause("1", "Nature of engagement", `<p class="prose">Your engagement is on an independent consultancy basis and shall not be construed as creating an employer-employee relationship. Nothing in this agreement shall entitle you to employee benefits unless expressly agreed in writing.</p><p class="prose">You shall provide mentorship services as and when assigned by BGHUB.</p>`) }${this.renderClause("2", "Commencement", `<p class="prose">This engagement shall commence on ${this.escapeHtml(context.generatedAt)} and shall remain in force until terminated by either party in accordance with this agreement.</p>`) }${this.renderClause("3", "Purpose of the engagement", `<p class="prose">The purpose of this engagement is to provide high-quality technical mentorship that equips trainees with practical competencies, professional ethics, industry exposure, and workplace readiness.</p>`) }${this.renderClause("4", "Duties and responsibilities", `<p class="prose">As a Technical Mentor, you shall:</p>${this.renderList(duties)}`)}${this.renderClause("5", "Areas of technical mentorship", `<p class="prose">${this.escapeHtml(payload.technicalArea || "Human Resource Management")}</p>`) }${this.renderClause("6", "Performance expectations", `<p class="prose">You shall be expected to:</p>${this.renderList(expectations)}`)}${this.renderClause("7", "Confidentiality", `<p class="prose">You shall treat all information relating to Bob Grogan Consulting Ltd, BGHUB, clients, trainees, partners, research activities, business operations, intellectual property, and financial information as confidential. You shall not disclose such information without prior written authorization. This obligation shall survive termination of this engagement.</p>`) }${this.renderClause("8", "Intellectual property", `<p class="prose">Any manuals, curricula, assessment tools, reports, software, templates, presentations, research outputs, training materials, or other works developed specifically for BGHUB under this engagement shall become the property of Bob Grogan Consulting Ltd unless otherwise agreed in writing. You shall retain ownership of intellectual property created independently prior to this engagement.</p>`) }${this.renderClause("9", "Conflict of interest", `<p class="prose">You shall disclose any actual or potential conflict of interest that may affect your ability to discharge your responsibilities impartially.</p>`) }${this.renderClause("10", "Professional conduct", `<p class="prose">You agree to uphold the highest standards of Integrity, Professionalism, Respect, Accountability, Confidentiality, Non-discrimination and Ethical conduct. You shall comply with all BGHUB policies, procedures, and professional standards.</p>`) }${this.renderClause("11", "Remuneration", `<p class="prose">This engagement is assignment-based. Where remuneration is applicable, payment shall be determined based on the specific assignment and may include Mentorship fees, Facilitation fees, Consultancy fees, Research supervision fees, Revenue-sharing arrangements, Honoraria and Reimbursement of approved expenses. Specific rates shall be communicated separately before commencement of each assignment through a Local Service Order (LSO).</p>`) }${this.renderClause("12", "Reporting relationship", `<p class="prose">For all mentorship assignments, you shall report to the Director, BGHUB Kenya, or such other officer as may be designated by the Director.</p>`) }${this.renderClause("13", "Working arrangements", `<p class="prose">Mentorship activities may be conducted physically or virtually through the BGHUB Learning Platform or partner institutions or workshops.</p>`) }${this.renderClause("14", "Duration and renewal", `<p class="prose">This engagement shall remain valid until terminated by either party. Continuation of assignments shall depend upon programme needs, availability of mentorship opportunities, your performance and compliance with BGHUB standards.</p>`) }${this.renderClause("15", "Termination", `<p class="prose">Either party may terminate this engagement by giving thirty (30) days' written notice. Bob Grogan Consulting Ltd reserves the right to terminate this engagement immediately in the event of gross misconduct, professional negligence, breach of confidentiality, fraud or dishonesty, conflict of interest, poor professional conduct or any act that may bring BGHUB or Bob Grogan Consulting Ltd into disrepute.</p>`) }${this.renderClause("16", "Governing law", `<p class="prose">This engagement shall be governed by the laws of the Republic of Kenya.</p>`) }${this.renderClause("17", "Acceptance", `<p class="prose">Kindly indicate your acceptance of this engagement by signing and returning a copy of this letter. We welcome you to the BGHUB Technical Mentorship Network and look forward to your contribution towards developing competent professionals who will transform organizations and strengthen health systems in Kenya and across Africa.</p><div class="signature-grid"><div class="signature-block"><div class="caption">For: Bob Grogan Consulting Ltd</div><div class="line"></div><div class="detail">Name / Designation</div><div class="detail">Signature / Date</div></div><div class="signature-block"><div class="caption">Acceptance by the Technical Mentor</div><div class="line"></div><div class="detail">Signature / Date</div><div class="detail">National ID/Passport No. / Telephone</div><div class="detail">Email</div></div></div>`) }${this.renderVerificationPanel(identity)}${this.renderFooter(context.verificationPath)}</main>`;
  }

  private static renderProfileDocument(payload: MenteeProfilePayload, context: TemplateContext, identity: IdentityView, logoDataUri?: string): string {
    const reference = this.buildDocumentReference({
      documentType: "MENTEE_PROFILE",
      registrationIdentifier: context.registrationIdentifier,
      generatedAt: context.generatedAt,
    });

    return `<main class="document">${this.renderHeader(reference, `Date: ${context.generatedAt}`, "Mentee profile", logoDataUri)}<div class="document-hero"><p class="eyebrow">Programme record</p><h1>Mentee Profile</h1></div>${this.renderSection("Profile summary", this.renderInformationCard([
      { label: "Full name", value: payload.fullName },
      { label: "Email", value: payload.email },
      { label: "Phone", value: payload.phoneNumber },
    ]))}${this.renderSection("Registration details", this.renderInformationCard([
      { label: "Registration number", value: context.registrationIdentifier },
      { label: "Mentorship track", value: payload.mentorshipTrack },
      { label: "Date registered", value: payload.dateRegistered ?? context.generatedAt },
      { label: "Registration status", value: payload.registrationStatus ?? "Provisional" },
      { label: "Payment status", value: payload.paymentStatus ?? "Pending" },
    ]))}${this.renderVerificationPanel(identity)}${this.renderFooter(context.verificationPath)}</main>`;
  }

  private static renderSection(title: string, content: string): string {
    return `<section class="section"><h2 class="section-title">${this.escapeHtml(title)}</h2>${content}</section>`;
  }

  private static renderClause(number: string, title: string, content: string): string {
    return `<section class="section"><h2 class="section-title"><span class="section-number">${this.escapeHtml(number)}</span>${this.escapeHtml(title)}</h2>${content}</section>`;
  }

  private static renderInformationCard(fields: Array<{ label: string; value: string }>): string {
    const html = fields.map((field) => `<div><span class="field-label">${this.escapeHtml(field.label)}</span><span class="field-value">${this.escapeHtml(field.value)}</span></div>`).join("");
    return `<div class="information-card"><div class="information-grid">${html}</div></div>`;
  }

  private static renderList(items: string[]): string {
    return `<ul class="legal-list">${items.map((item) => `<li>${this.escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  private static renderHeader(reference: string, date: string, title: string, logoDataUri?: string): string {
    const logo = logoDataUri ? `<img src="${logoDataUri}" alt="" />` : "";
    return `<header class="document-header"><div class="brand">${logo}<div><p class="brand-name">BGHUB Kenya</p><p class="brand-subtitle">A division of Bob Grogan Consulting Ltd</p></div></div><div class="header-meta"><strong>${this.escapeHtml(reference)}</strong>${this.escapeHtml(date)}<br />${this.escapeHtml(title)}</div></header>`;
  }

  private static renderHeaderMeta(reference: string, date: string, title: string): string {
    return `<div class="header-meta"><strong>${this.escapeHtml(reference)}</strong>${this.escapeHtml(date)}<br />${this.escapeHtml(title)}</div>`;
  }

  private static renderVerificationPanel(identity: IdentityView): string {
    return `<section class="verification-panel"><div class="verification-copy"><h2>Document verification</h2><p class="identifier">${this.escapeHtml(identity.registrationIdentifier)}</p><p>Scan the QR code or visit ${this.escapeHtml(identity.verificationPath)} to verify this document.</p><img class="barcode" src="${identity.barcodeDataUri}" alt="Barcode for ${this.escapeHtml(identity.registrationIdentifier)}" /></div><img class="qr" src="${identity.qrDataUri}" alt="QR code for ${this.escapeHtml(identity.registrationIdentifier)}" /></section>`;
  }

  private static renderFooter(verificationPath: string): string {
    return `<footer class="document-footer"><span>BGHUB Kenya | Bob Grogan Consulting Ltd</span><span>Verify: ${this.escapeHtml(verificationPath)}</span></footer>`;
  }

  private static escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  static buildDocumentReference(input: {
    documentType: SupportedDocumentType;
    registrationIdentifier: string;
    generatedAt?: string;
  }): string {
    const normalized = this.normalizeReferenceIdentifier(input.registrationIdentifier);
    const sequence = normalized.match(/-(\d{5})$/)?.[1] ?? "00001";
    const year = input.generatedAt ? new Date(input.generatedAt).getFullYear() : new Date().getFullYear();
    const docCode = input.documentType === "PROVISIONAL_ADMISSION_LETTER"
      ? "ADM"
      : input.documentType === "TECHNICAL_MENTOR_ENGAGEMENT_LETTER"
        ? "ENG"
        : "PRF";

    return `BGHUB-${docCode}-${year}-${sequence}`;
  }

  private static normalizeReferenceIdentifier(registrationIdentifier: string): string {
    return registrationIdentifier.trim().toUpperCase();
  }

  private static extractRegistrationIdentifier<TPayload extends object>(payload: TPayload): string {
    const value = (payload as Record<string, unknown>).registrationIdentifier;
    return typeof value === "string" && value.trim() ? value : "TM-KE-00001";
  }

  private static extractGeneratedAt<TPayload extends object>(payload: TPayload): string {
    const data = payload as Record<string, unknown>;
    const value = data.generatedAt ?? data.dateRegistered;
    return typeof value === "string" && value.trim() ? value : new Date().toISOString().split("T")[0] ?? "2026-07-22";
  }

  private static formatDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().split("T")[0] ?? value;
  }

  private static toFolderName(documentType: SupportedDocumentType): string {
    return documentType.toLowerCase().replace(/_/g, "-");
  }

  private static toFileName(documentType: SupportedDocumentType): string {
    return documentType.toLowerCase().replace(/_/g, "-");
  }
}
