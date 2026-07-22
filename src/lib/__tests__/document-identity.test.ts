import test from "node:test";
import assert from "node:assert/strict";
import { DocumentIdentityService } from "../services/document-identity";

test("builds a verification path from a registration identifier", () => {
  const verificationPath = DocumentIdentityService.buildVerificationPath(
    "CM-KE-00021",
  );

  assert.equal(verificationPath, "/verify/CM-KE-00021");
});

test("renders barcode and QR code buffers for a registration identifier", async () => {
  const assets = await DocumentIdentityService.generateIdentityAssets(
    "TM-KE-00007",
  );

  assert.equal(assets.registrationIdentifier, "TM-KE-00007");
  assert.equal(assets.verificationPath, "/verify/TM-KE-00007");
  assert.ok(Buffer.isBuffer(assets.qrCodeBuffer));
  assert.ok(assets.qrCodeBuffer.length > 0);
  assert.ok(Buffer.isBuffer(assets.barcodeBuffer));
  assert.ok(assets.barcodeBuffer.length > 0);
});
