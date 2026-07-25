import test from "node:test";
import assert from "node:assert/strict";
import { buildFinalAdmissionLetterPayload, buildPaymentConfirmationUpdate } from "../payment-service";

test("buildPaymentConfirmationUpdate marks mentees as paid and active", () => {
  const update = buildPaymentConfirmationUpdate({
    confirmedBy: "admin-1",
    role: "STUDENT",
    paymentStatus: "PENDING",
  });

  assert.equal(update.paymentStatus, "PAID");
  assert.equal(update.accountStatus, "ACTIVE");
  assert.ok(update.paymentConfirmedAt instanceof Date);
  assert.equal(update.paymentConfirmedBy, "admin-1");
});

test("buildPaymentConfirmationUpdate leaves non-mentee roles unchanged", () => {
  const update = buildPaymentConfirmationUpdate({
    confirmedBy: "admin-1",
    role: "ADMIN",
    paymentStatus: "PENDING",
  });

  assert.equal(update.paymentStatus, "PAID");
  assert.equal(update.accountStatus, "ACTIVE");
  assert.ok(update.paymentConfirmedAt instanceof Date);
});

test("buildFinalAdmissionLetterPayload includes login credentials and official admission details", () => {
  const payload = buildFinalAdmissionLetterPayload({
    id: "user-1",
    email: "student@example.com",
    name: "Jane Doe",
    phone: "+254700000000",
    registrationIdentifier: "CM-KE-00021",
    role: "STUDENT",
    studentProfile: {
      mentorshipTrack: "CAREER",
      cohort: { name: "Cohort A" },
    },
    defaultPassword: "ChangeMe123",
  });

  assert.equal(payload.recipientName, "Jane Doe");
  assert.equal(payload.email, "student@example.com");
  assert.equal(payload.registrationTrack, "Career Mentorship");
  assert.equal(payload.loginEmail, "student@example.com");
  assert.equal(payload.loginUsername, "student@example.com");
  assert.equal(payload.defaultPassword, "ChangeMe123");
  assert.equal(payload.loginUrl, "http://localhost:3000/auth/signin");
  assert.equal(payload.isOfficialAdmission, true);
  assert.equal(payload.paymentStatus, "PAID");
});
