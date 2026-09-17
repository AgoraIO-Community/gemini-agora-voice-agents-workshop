// Server-side credential lookup. The deck was deployed with AGORA_APP_ID /
// AGORA_APP_CERTIFICATE; the demo apps use the NEXT_* names. Accept both so an
// existing Vercel project keeps working while new ones follow .env.example.

export function agoraAppId(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.NEXT_PUBLIC_AGORA_APP_ID || env.AGORA_APP_ID || undefined;
}

export function agoraAppCertificate(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.NEXT_AGORA_APP_CERTIFICATE || env.AGORA_APP_CERTIFICATE || undefined;
}

export function googleApiKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.NEXT_GOOGLE_API_KEY || env.GOOGLE_API_KEY || undefined;
}

export function requireAgoraCredentials(env: NodeJS.ProcessEnv = process.env): { appId: string; appCertificate: string } {
  const appId = agoraAppId(env);
  const appCertificate = agoraAppCertificate(env);
  if (!appId || !appCertificate) {
    throw new Error('Missing Agora configuration. Set NEXT_PUBLIC_AGORA_APP_ID and NEXT_AGORA_APP_CERTIFICATE.');
  }
  return { appId, appCertificate };
}

export function requireGoogleApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = googleApiKey(env);
  if (!key) throw new Error('Missing required environment variable: NEXT_GOOGLE_API_KEY');
  return key;
}
