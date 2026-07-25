import test from "node:test";
import assert from "node:assert/strict";
import { BRANDING } from "../branding";

test("branding uses BGhub Kenya for user-facing system names", () => {
  assert.equal(BRANDING.organizationName, "BGhub Kenya");
  assert.equal(BRANDING.systemName, "BGhub Kenya WorkLog System");
  assert.equal(BRANDING.appName, "BGhub Kenya WorkLog");
  assert.equal(BRANDING.shortName, "BGhub Kenya");
  assert.equal(BRANDING.footerText, "© 2026 BGhub Kenya. All rights reserved.");
});
