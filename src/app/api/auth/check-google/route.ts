import { NextResponse } from "next/server";

/**
 * Debug endpoint untuk verify Google OAuth configuration.
 * Return status tanpa bocor secret.
 *
 * Gunakan ini untuk troubleshooting Google login issues.
 */
export async function GET() {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextauthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextauthUrl = !!process.env.NEXTAUTH_URL;

  const enabled = hasClientId && hasClientSecret;

  // Detect common config mistakes
  const issues: string[] = [];

  if (!hasClientId) {
    issues.push("GOOGLE_CLIENT_ID belum diset di env var");
  }
  if (!hasClientSecret) {
    issues.push("GOOGLE_CLIENT_SECRET belum diset di env var");
  }
  if (!hasNextauthSecret) {
    issues.push("NEXTAUTH_SECRET belum diset — diperlukan untuk JWT encryption");
  }
  if (!hasNextauthUrl) {
    issues.push("NEXTAUTH_URL belum diset — diperlukan untuk Google redirect URI");
  }

  // Check GOOGLE_CLIENT_ID format (should start with xxxx.apps.googleusercontent.com)
  if (hasClientId) {
    const id = process.env.GOOGLE_CLIENT_ID!;
    if (!id.includes(".apps.googleusercontent.com")) {
      issues.push(
        "GOOGLE_CLIENT_ID format tidak valid — harus end dengan .apps.googleusercontent.com"
      );
    }
  }

  // Compute expected redirect URI
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const expectedRedirectUri = `${baseUrl}/api/auth/callback/google`;

  return NextResponse.json({
    enabled,
    configured: {
      googleClientId: hasClientId,
      googleClientSecret: hasClientSecret,
      nextauthSecret: hasNextauthSecret,
      nextauthUrl: hasNextauthUrl,
    },
    expectedRedirectUri,
    callbackUrl: "/api/auth/callback/google",
    issues,
    nextSteps: enabled
      ? [
          `Pastikan redirect URI di Google Cloud Console = ${expectedRedirectUri}`,
          "Test login: buka /sign-in, klik 'Sign in dengan Google'",
        ]
      : [
          "1. Buka https://console.cloud.google.com/apis/credentials",
          "2. Create Credentials → OAuth client ID → Web application",
          `3. Authorized redirect URI: ${expectedRedirectUri}`,
          "4. Copy Client ID + Client Secret ke env var",
          "5. Restart server / redeploy",
        ],
  });
}
