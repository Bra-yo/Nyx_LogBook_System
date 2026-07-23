import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentIdentityService } from "./document-identity";
import {
  buildReactPdfDocument,
  type ReactPdfIdentityView,
  type ReactPdfTemplateContext,
} from "./react-pdf-document-engine";

export type SupportedDocumentType = "PROVISIONAL_ADMISSION_LETTER" | "TECHNICAL_MENTOR_ENGAGEMENT_LETTER" | "MENTEE_PROFILE";
export interface DocumentGenerationArtifact { filePath: string; fileName: string; documentType: SupportedDocumentType; registrationIdentifier: string; verificationPath: string; generatedTimestamp: string; }
export interface ProvisionalAdmissionLetterPayload { recipientName: string; email: string; phoneNumber: string; registrationTrack: string; registrationIdentifier: string; generatedAt?: string; registrationStatus?: string; paymentStatus?: string; registrationValidityHours?: number; }
export interface TechnicalMentorEngagementLetterPayload { mentorName: string; email: string; technicalArea: string; registrationIdentifier: string; generatedAt?: string; }
export interface MenteeProfilePayload { fullName: string; email: string; phoneNumber: string; mentorshipTrack: string; registrationIdentifier: string; registrationStatus?: string; paymentStatus?: string; dateRegistered?: string; }
interface TemplateContext { documentType: SupportedDocumentType; registrationIdentifier: string; verificationPath: string; generatedAt: string; }
type IdentityAssets = Awaited<ReturnType<typeof DocumentIdentityService.generateIdentityAssets>>;

export class DocumentGenerationService {
  static async generateDocument<TPayload extends object>(documentType: SupportedDocumentType, payload: TPayload): Promise<DocumentGenerationArtifact> {
    const { context, identityAssets } = await this.buildTemplateContext(documentType, payload);
    const assetRoot = path.resolve(process.cwd(), "documents", this.toFolderName(documentType));
    await mkdir(assetRoot, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${this.toFileName(documentType)}-${timestamp}.pdf`;
    const filePath = path.join(assetRoot, fileName);

    const logoDataUri = await this.loadLogoDataUri();
    const identity: ReactPdfIdentityView = {
      registrationIdentifier: context.registrationIdentifier,
      verificationPath: context.verificationPath,
      qrDataUri: `data:${identityAssets.qrCodeMimeType};base64,${identityAssets.qrCodeBuffer.toString("base64")}`,
      barcodeDataUri: `data:${identityAssets.barcodeMimeType};base64,${identityAssets.barcodeBuffer.toString("base64")}`,
    };

    const templateContext: ReactPdfTemplateContext = {
      documentType: context.documentType,
      registrationIdentifier: context.registrationIdentifier,
      verificationPath: context.verificationPath,
      generatedAt: context.generatedAt,
    };

    const documentElement = buildReactPdfDocument(documentType, payload, templateContext, identity, logoDataUri);
    const pdfBuffer = await renderToBuffer(documentElement as never);
    await writeFile(filePath, pdfBuffer);

    return {
      filePath,
      fileName,
      documentType,
      registrationIdentifier: context.registrationIdentifier,
      verificationPath: context.verificationPath,
      generatedTimestamp: context.generatedAt,
    };
  }

  private static async loadLogoDataUri(): Promise<string | undefined> {
    try {
      const buffer = await readFile(path.resolve(process.cwd(), "public", "bob-grogan-logo.png"));
      return `data:image/png;base64,${buffer.toString("base64")}`;
    } catch {
      return undefined;
    }
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
