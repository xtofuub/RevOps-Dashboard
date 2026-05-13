import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
const secretPattern = /^SESSION_SECRET=(.*)$/m;
const placeholder = "replace_with_at_least_32_char_random_string";

function makeSecret() {
  return randomBytes(48).toString("hex");
}

function hasUsableSecret(value) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");

  return trimmed.length >= 32 && trimmed !== placeholder;
}

const currentEnv = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const match = currentEnv.match(secretPattern);

if (match && hasUsableSecret(match[1] ?? "")) {
  process.exit(0);
}

const nextSecret = makeSecret();
const nextEnv = match
  ? currentEnv.replace(secretPattern, `SESSION_SECRET=${nextSecret}`)
  : `${currentEnv}${currentEnv && !currentEnv.endsWith("\n") ? "\n" : ""}SESSION_SECRET=${nextSecret}\n`;

writeFileSync(envPath, nextEnv);
console.log("Created SESSION_SECRET in .env.local for local app runs.");
