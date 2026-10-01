// Create an /admin account, or reset its password.
//
//   node backend/scripts/new-admin.js <username>
//
// Generates a long random password, stores only its bcrypt hash in
// backend/src/admins.js, and writes the password itself to
// ~/ClearAir-admin-<username>.txt (readable only by you). The password is never
// printed, so it doesn't end up in terminal history or logs. Move it into a
// password manager, delete the file, then commit and push admins.js.
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ADMINS_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "admins.js");
const MARKER = "  // new-admin.js adds entries above this line";

const username = (process.argv[2] || "").trim().toLowerCase();
if (!/^[a-z0-9][a-z0-9._-]{1,31}$/.test(username)) {
  console.error("Usage: node backend/scripts/new-admin.js <username>");
  console.error("Username: 2-32 characters, lowercase letters, digits, '.', '_' or '-'.");
  process.exit(1);
}

const outFile = join(homedir(), `ClearAir-admin-${username}.txt`);
if (existsSync(outFile)) {
  console.error(`${outFile} already exists. Save that password somewhere, delete the file, and run again.`);
  process.exit(1);
}

let source = readFileSync(ADMINS_FILE, "utf8");
if (!source.includes(MARKER)) {
  console.error(`Couldn't find the marker line in ${ADMINS_FILE}; add the account by hand.`);
  process.exit(1);
}

// 24 random bytes -> 32 URL-safe characters (192 bits): far beyond guessing,
// which is what makes it safe to commit the hash.
const password = randomBytes(24).toString("base64url");
const passwordHash = bcrypt.hashSync(password, 12);

const entry = `  { username: ${JSON.stringify(username)}, passwordHash: ${JSON.stringify(passwordHash)} },`;
const existing = new RegExp(`^.*username: ${JSON.stringify(username).replace(/[.]/g, "\\.")},.*$\\n`, "m");
const reset = existing.test(source);
source = source.replace(existing, "").replace(MARKER, `${entry}\n${MARKER}`);
writeFileSync(ADMINS_FILE, source);

writeFileSync(
  outFile,
  [
    "ClearAir admin sign-in",
    "",
    `Username: ${username}`,
    `Password: ${password}`,
    "",
    "Sign in at https://<your-site>/admin (http://localhost:5173/admin when running locally).",
    "Move this password into a password manager, then delete this file.",
    "",
  ].join("\n"),
  { mode: 0o600 }
);

console.log(`${reset ? "Reset the password for" : "Added"} admin "${username}" in backend/src/admins.js.`);
console.log(`Password saved to ${outFile} (not shown here).`);
console.log("Commit and push admins.js to make it live.");
