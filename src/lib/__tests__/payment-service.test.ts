import test from "node:test";
import assert from "node:assert/strict";
import { buildPaymentConfirmationUpdate } from "../payment-service";

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
