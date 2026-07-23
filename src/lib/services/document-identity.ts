import * as QRCode from "qrcode";

export interface DocumentIdentityAssets {
  registrationIdentifier: string;
  verificationPath: string;
  qrCodeBuffer: Buffer;
  qrCodeMimeType: "image/png";
  barcodeBuffer: Buffer;
  barcodeMimeType: "image/svg+xml";
}

export class DocumentIdentityService {
  private static readonly REGISTRATION_IDENTIFIER_PATTERN = /^(TM|CM|BM)-KE-\d{5}$/;

  static buildVerificationPath(registrationIdentifier: string): string {
    const normalizedIdentifier = this.normalizeRegistrationIdentifier(
      registrationIdentifier,
    );

    return `/verify/${normalizedIdentifier}`;
  }

  static async generateIdentityAssets(
    registrationIdentifier: string,
  ): Promise<DocumentIdentityAssets> {
    const normalizedIdentifier = this.normalizeRegistrationIdentifier(
      registrationIdentifier,
    );

    const [qrCodeBuffer, barcodeBuffer] = await Promise.all([
      this.generateQrCodeBuffer(normalizedIdentifier),
      this.generateBarcodeBuffer(normalizedIdentifier),
    ]);

    return {
      registrationIdentifier: normalizedIdentifier,
      verificationPath: this.buildVerificationPath(normalizedIdentifier),
      qrCodeBuffer,
      qrCodeMimeType: "image/png",
      barcodeBuffer,
      barcodeMimeType: "image/svg+xml",
    };
  }

  static normalizeRegistrationIdentifier(registrationIdentifier: string): string {
    const trimmedIdentifier = registrationIdentifier.trim().toUpperCase();

    if (!this.REGISTRATION_IDENTIFIER_PATTERN.test(trimmedIdentifier)) {
      throw new Error(
        `Invalid registration identifier: ${registrationIdentifier}`,
      );
    }

    return trimmedIdentifier;
  }

  private static buildQrCodeData(registrationIdentifier: string): string {
    // Keep the public service API stable while allowing future verification URL targets.
    return this.buildVerificationPath(registrationIdentifier);
  }

  private static async generateQrCodeBuffer(
    registrationIdentifier: string,
  ): Promise<Buffer> {
    const qrData = this.buildQrCodeData(registrationIdentifier);
    return QRCode.toBuffer(qrData, {
      width: 512,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
  }

  private static async generateBarcodeBuffer(
    registrationIdentifier: string,
  ): Promise<Buffer> {
    const svg = this.buildBarcodeSvg(registrationIdentifier);
    return Buffer.from(svg, "utf8");
  }

  private static buildBarcodeSvg(registrationIdentifier: string): string {
    const quietZone = 24;
    const barHeight = 92;
    const textY = 140;
    const fontSize = 24;
    const height = 170;

    const encodedValues = this.encodeCode128(registrationIdentifier);
    const patterns = encodedValues.map((value) => this.getCode128Pattern(value));
    const stopPattern = this.getCode128Pattern(106);
    const barcodePatterns = [...patterns, stopPattern];

    const totalUnits = barcodePatterns.reduce((total, pattern) => {
      return (
        total + pattern.split("").reduce((sum, char) => sum + Number(char), 0)
      );
    }, 0);

    const width = Math.max(560, quietZone * 2 + totalUnits * 3);
    const moduleWidth = Math.max(1, Math.floor((width - quietZone * 2) / totalUnits));
    const actualWidth = quietZone * 2 + totalUnits * moduleWidth;

    const bars: string[] = [];
    let cursorX = quietZone;

    const pushBar = (barWidth: number, isBlack: boolean) => {
      const x = cursorX;
      const y = 20;
      bars.push(
        `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${isBlack ? "#000000" : "#ffffff"}" />`,
      );
      cursorX += barWidth;
    };

    for (const pattern of barcodePatterns) {
      for (let index = 0; index < pattern.length; index += 1) {
        const widthUnits = Number(pattern[index]);
        const barWidth = widthUnits * moduleWidth;
        const isBlack = index % 2 === 0;
        pushBar(barWidth, isBlack);
      }
    }

    const text = `<text x="${actualWidth / 2}" y="${textY}" text-anchor="middle" font-family="Helvetica" font-size="${fontSize}" fill="#111827">${registrationIdentifier}</text>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${actualWidth}" height="${height}" viewBox="0 0 ${actualWidth} ${height}">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${bars.join("")}
  ${text}
</svg>`;
  }

  private static encodeCode128(registrationIdentifier: string): number[] {
    const values = Array.from(registrationIdentifier).map((char) => {
      const code = char.charCodeAt(0) - 32;
      if (code < 0 || code > 95 || !Number.isInteger(code)) {
        throw new Error(`Unsupported character for Code 128 barcode: ${char}`);
      }
      return code;
    });

    const startCode = 104; // Start Code B
    const checksum = values.reduce((accumulator, value, index) => {
      return (accumulator + value * (index + 1)) % 103;
    }, startCode);

    // Return start, data values and checksum. The stop code pattern (106)
    // is appended by the SVG builder to keep responsibilities clear.
    return [startCode, ...values, checksum];
  }

  private static getCode128Pattern(value: number): string {
    const patterns = [
      "212222",
      "222122",
      "222221",
      "121223",
      "121322",
      "131222",
      "122213",
      "122312",
      "132212",
      "221213",
      "221312",
      "231212",
      "112232",
      "122132",
      "122231",
      "113222",
      "123122",
      "123221",
      "223211",
      "221132",
      "221231",
      "213212",
      "223112",
      "312131",
      "311222",
      "321122",
      "321221",
      "312212",
      "322112",
      "322211",
      "212123",
      "212321",
      "232121",
      "111323",
      "131123",
      "131321",
      "112313",
      "132113",
      "132311",
      "211313",
      "231113",
      "231311",
      "112133",
      "112331",
      "132131",
      "113123",
      "113321",
      "133121",
      "313121",
      "211331",
      "231131",
      "213113",
      "213311",
      "213131",
      "311123",
      "311321",
      "331121",
      "312113",
      "312311",
      "332111",
      "314111",
      "221411",
      "431111",
      "111224",
      "111422",
      "121224",
      "121422",
      "141224",
      "141422",
      "112214",
      "112412",
      "122114",
      "122411",
      "142114",
      "142411",
      "241211",
      "221114",
      "413111",
      "241112",
      "134111",
      "111242",
      "121142",
      "121241",
      "114212",
      "124112",
      "124211",
      "411212",
      "421112",
      "421211",
      "212141",
      "214121",
      "412121",
      "111143",
      "111341",
      "131141",
      "114113",
      "114311",
      "411113",
      "411311",
      "113141",
      "114131",
      "311141",
      "411131",
      "211412",
      "211214",
      "211232",
      "2331112",
    ];

    const pattern = patterns[value];
    if (!pattern) {
      throw new Error(`Unsupported Code 128 value: ${value}`);
    }

    return pattern;
  }
}
