#!/usr/bin/env node
/**
 * Usage: node scripts/hash-password.js "your-password"
 * Outputs APP_PASSWORD_HASH value for .env.local
 */
const { randomBytes, scryptSync } = require("crypto");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

const salt = randomBytes(16);
const derived = scryptSync(password, salt, 64);
const hash = `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
console.log(`APP_PASSWORD_HASH=${hash}`);
