import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { DocumentGenerationService } from "../services/document-generation";

test("generates a provisional admission letter PDF with metadata", async () => {
  const artifact = await DocumentGenerationService.generateDocument(
    "PROVISIONAL_ADMISSION_LETTER",
    {
      recipientName: "Amina Yusuf",
      email: "amina@example.com",
      phoneNumber: "+2348012345678",
      registrationTrack: "Career & Business Mentorship",
      registrationIdentifier: "CM-KE-00021",
      generatedAt: "2026-07-22",
    },
  );

  assert.equal(artifact.documentType, "PROVISIONAL_ADMISSION_LETTER");
  assert.equal(artifact.registrationIdentifier, "CM-KE-00021");
  assert.equal(artifact.verificationPath, "/verify/CM-KE-00021");
  assert.ok(artifact.fileName.endsWith(".pdf"));

  await access(artifact.filePath);
});

test("generates a technical mentor engagement letter PDF", async () => {
  const artifact = await DocumentGenerationService.generateDocument(
    "TECHNICAL_MENTOR_ENGAGEMENT_LETTER",
    {
      mentorName: "Ibrahim Musa",
      email: "ibrahim@example.com",
      technicalArea: "Software Engineering",
      registrationIdentifier: "TM-KE-00033",
      generatedAt: "2026-07-22",
    },
  );

  assert.equal(artifact.documentType, "TECHNICAL_MENTOR_ENGAGEMENT_LETTER");
  assert.equal(artifact.registrationIdentifier, "TM-KE-00033");
  assert.ok(artifact.fileName.endsWith(".pdf"));

  await access(artifact.filePath);
});

test("generates a mentee profile PDF for printing", async () => {
  const artifact = await DocumentGenerationService.generateDocument(
    "MENTEE_PROFILE",
    {
      fullName: "Grace Okafor",
      email: "grace@example.com",
      phoneNumber: "+2348023456789",
      mentorshipTrack: "Career & Business Mentorship",
      registrationIdentifier: "BM-KE-00012",
      registrationStatus: "Provisional",
      paymentStatus: "Pending",
      dateRegistered: "2026-07-18",
    },
  );

  assert.equal(artifact.documentType, "MENTEE_PROFILE");
  assert.equal(artifact.registrationIdentifier, "BM-KE-00012");
  assert.ok(artifact.fileName.endsWith(".pdf"));

  await access(artifact.filePath);
});

test("builds a dynamic admission document reference from the user identifier and date", () => {
  const reference = DocumentGenerationService.buildDocumentReference({
    documentType: "PROVISIONAL_ADMISSION_LETTER",
    registrationIdentifier: "CM-KE-00021",
    generatedAt: "2026-07-22",
  });

  assert.equal(reference, "BGHUB-ADM-2026-00021");
});
