import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../services/email-service";

test("escapes registration values before inserting them into HTML email templates", () => {
  assert.equal(
    escapeHtml(`<Amina> & "BG HUB"`),
    "&lt;Amina&gt; &amp; &quot;BG HUB&quot;",
  );
});