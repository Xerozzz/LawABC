// Accounts that can sign in at /admin.
//
// These are separate from participant accounts: they exist only in this file,
// never in the users table, so nobody can create one from the app and they
// never show up in the study data.
//
// Only a bcrypt hash of each password is kept here. To add someone (or reset
// their password), run from the repo root:
//   node backend/scripts/new-admin.js <username>
// It updates this file and writes the new password to a file in your home
// folder. Commit and push to deploy. To remove someone, delete their line and
// push: they're signed out on their next request, even mid-session.
export const ADMIN_ACCOUNTS = [
  { username: "admin", passwordHash: "$2a$12$3s4KxFU3Z3ELsT5tod6Np.l/5bUudXWAok7zZGQ3lLw4S84vLildu" },
  // new-admin.js adds entries above this line
];
