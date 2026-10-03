/**
 * Environment configuration and startup validation
 * Validates critical environment variables so the server fails fast with clear errors.
 */

export function validateEnv() {
  const warnings = [];
  const errors = [];

  if (!process.env.MONGO_URI) {
    errors.push("MONGO_URI is missing. Database operations will fail.");
  }

  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    warnings.push("CLERK_PUBLISHABLE_KEY is not set.");
  }

  if (!process.env.CLERK_SECRET_KEY) {
    warnings.push("CLERK_SECRET_KEY is not set. Authentication verification will fail.");
  }

  if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    warnings.push("IMAGEKIT_PRIVATE_KEY is not set. Image and video uploads will be disabled.");
  }

  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    warnings.push("CLERK_WEBHOOK_SIGNING_SECRET is not set. Clerk user sync webhooks will fail.");
  }

  if (warnings.length > 0) {
    console.warn("⚠️  [Environment Warning]:\n - " + warnings.join("\n - "));
  }

  if (errors.length > 0) {
    console.error("❌ [Environment Error]:\n - " + errors.join("\n - "));
  }
}

/**
 * Returns a normalized array of allowed CORS origins based on FRONTEND_URL and local defaults.
 */
export function getAllowedOrigins() {
  const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
  const configured = process.env.FRONTEND_URL;

  if (!configured) return defaultOrigins;

  // Clean trailing slashes
  const trimmed = configured.trim().replace(/\/+$/, "");
  const origins = new Set([trimmed, ...defaultOrigins]);
  return Array.from(origins);
}
