import QRCode from "qrcode";
import { OfficeLocation } from "@/types";

export interface ParsedQRCodeData {
  isJson: boolean;
  raw: string;
  qrCodeData: string;
  qrToken?: string;
  token?: string;
  officeToken?: string;
  type?: string;
  locationId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export class QRCodeService {
  /**
   * Generate QR code data URL for office location
   */
  static async generateQRCodeDataURL(
    officeLocation: OfficeLocation,
  ): Promise<string> {
    try {
      // Generate QR code with plain text matching qrCodeData field exactly
      const qrData = officeLocation.qrCodeData;

      const dataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });

      return dataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate QR code data string for office location
   */
  static generateQRCodeData(officeLocation: OfficeLocation): string {
    // Return plain text matching qrCodeData field exactly
    return officeLocation.qrCodeData;
  }

  /**
   * Parse QR code data safely
   */
  static parseQRCodeData(qrData: string): ParsedQRCodeData {
    const cleaned = qrData.trim();

    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      return {
        isJson: true,
        raw: cleaned,
        ...parsed,
        qrCodeData:
          (parsed["qrCodeData"] as string | undefined) ||
          (parsed["qrToken"] as string | undefined) ||
          (parsed["token"] as string | undefined) ||
          (parsed["officeToken"] as string | undefined) ||
          cleaned,
      };
    } catch (error) {
      // Return plain text as-is
      return {
        isJson: false,
        raw: cleaned,
        qrCodeData: cleaned,
        qrToken: cleaned,
        token: cleaned,
      };
    }
  }

  /**
   * Validate QR code data format
   */
  static validateQRCodeData(data: unknown): data is ParsedQRCodeData {
    if (!data || typeof data !== "object") return false;
    const d = data as ParsedQRCodeData;
    return (
      d.type === "attendance" &&
      typeof d.locationId === "string" &&
      typeof d.locationName === "string" &&
      typeof d.latitude === "number" &&
      typeof d.longitude === "number" &&
      typeof d.radius === "number" &&
      typeof d.timestamp === "string"
    );
  }

  /**
   * Generate QR code for download
   */
  static async generateDownloadableQRCode(
    officeLocation: OfficeLocation,
  ): Promise<Buffer> {
    try {
      const qrData = this.generateQRCodeData(officeLocation);
      const buffer = await QRCode.toBuffer(qrData, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });

      return buffer;
    } catch (error) {
      console.error("Error generating downloadable QR code:", error);
      throw new Error("Failed to generate downloadable QR code");
    }
  }
}
