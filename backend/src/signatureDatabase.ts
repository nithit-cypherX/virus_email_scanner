// src/signatureDatabase.ts
// --- This file acts as the central "brain" for our detection logic ---

// --- 1. For File Attachments ---

/**
 * A Set of industry-standard fuzzy hashes (ssdeep) for known malware.
 * We use a fuzzy hash to detect malware even if it's been slightly modified.
 *
 * This hash: "3:a+JraNvsgzsVqSwHq9:tJuOgzsko"
 * Corresponds to: The 68-byte EICAR standard antivirus test file.
 */
export const virusSignatures = new Set<string>([
  "3:a+JraNvsgzsVqSwHq9:tJuOgzsko"
]);

// --- 2. For Malicious Email Bodies ---

/**
 * An array of keyword Sets. An email is flagged if *all* keywords
 * (or typos of them) in *any one* of these sets are present in the email body.
 * This is more robust than checking for one exact, brittle phrase.
 */
export const maliciousKeywordSets = [
  // Set 1: Password reset scam
  new Set(["password", "expired", "update"]),
  // Set 2: Sign-in scam
  new Set(["unusual", "sign-in", "activity", "account"]),
  // Set 3: Mailbox full scam
  new Set(["urgent", "action", "required", "mailbox", "full"]),
  // Set 4: Invoice scam
  new Set(["invoice", "attached", "payment", "review"])
];


// --- 3. For Malicious Links (Phishing) ---

/**
 * A Set of known malicious domains.
 * This is used to check against the hostname of any link found in the email.
 * It's designed to catch common typosquatting and subdomain tricks.
 */
export const maliciousDomains = new Set<string>([
  "microsft-support.com",
  "paypal.security-center.com",
  "login-wellsfargo.net",
  "amazon-prime.org"
]);