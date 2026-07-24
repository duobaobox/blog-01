import { pathToFileURL } from "node:url";

const WEAK_VALUES = new Set([
  "admin",
  "admin123456",
  "blog",
  "change-me",
  "change-this-db-password",
  "change-this-secret",
  "password",
  "replace-with-a-strong-password",
  "replace-with-a-one-time-setup-token",
  "your-secret-key-here",
]);

function readRequired(env, name, issues) {
  const value = env[name]?.trim();
  if (!value) {
    issues.push(name + " is required");
    return "";
  }
  return value;
}

function parseRequiredUrl(env, name, issues, warnings) {
  const raw = readRequired(env, name, issues);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      issues.push(name + " must use http or https");
    }
    if (url.hostname === "localhost") {
      issues.push(name + " must not use localhost in production");
    }
    if (url.protocol !== "https:") {
      warnings.push(name + " is not using HTTPS");
    }
    return url;
  } catch {
    issues.push(name + " must be an absolute URL");
    return null;
  }
}

export function validateProductionEnvironment(env = process.env) {
  if (env.NODE_ENV !== "production") return { warnings: [] };

  const issues = [];
  const warnings = [];
  const databaseUrl = readRequired(env, "DATABASE_URL", issues);
  const authSecret = readRequired(env, "BETTER_AUTH_SECRET", issues);
  const setupToken = readRequired(env, "ADMIN_SETUP_TOKEN", issues);
  const authUrl = parseRequiredUrl(env, "BETTER_AUTH_URL", issues, warnings);
  const siteUrl = parseRequiredUrl(env, "SITE_URL", issues, warnings);

  if (authSecret && (authSecret.length < 32 || WEAK_VALUES.has(authSecret.toLowerCase()))) {
    issues.push("BETTER_AUTH_SECRET must be at least 32 characters and not a placeholder");
  }
  if (setupToken && (setupToken.length < 16 || WEAK_VALUES.has(setupToken.toLowerCase()))) {
    issues.push("ADMIN_SETUP_TOKEN must be at least 16 characters and not a placeholder");
  }

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      const password = decodeURIComponent(url.password);
      if (!password || password.length < 16 || WEAK_VALUES.has(password.toLowerCase())) {
        issues.push("DATABASE_URL must contain a database password of at least 16 characters");
      }
    } catch {
      issues.push("DATABASE_URL must be a valid URL");
    }
  }

  if (authUrl && siteUrl && authUrl.origin !== siteUrl.origin) {
    warnings.push("BETTER_AUTH_URL and SITE_URL use different origins");
  }

  if (issues.length > 0) {
    throw new Error("Production environment validation failed:\n- " + issues.join("\n- "));
  }

  return { warnings };
}

export function main() {
  const result = validateProductionEnvironment(process.env);
  for (const warning of result.warnings) {
    console.warn("Environment warning: " + warning);
  }
  console.log("Production environment validation passed.");
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
