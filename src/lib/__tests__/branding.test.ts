import test from "node:test";
import assert from "node:assert/strict";
import { BRANDING } from "../branding";

test("branding uses BGHUB Kenya for user-facing system names", () => {
  assert.equal(BRANDING.organizationName, "BGHUB Kenya");
  assert.equal(BRANDING.systemName, "BGHUB Kenya WorkLog System");
  assert.equal(BRANDING.appName, "BGHUB Kenya WorkLog");
  assert.equal(BRANDING.shortName, "BGHUB Kenya");
  assert.equal(BRANDING.footerText, "© 2026 BGHUB Kenya. All rights reserved.");
});
