import {
  createSupabaseRestQueryLayer,
  type QueryLayer
} from "@ypi/data-access";

function readEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createServerQueryLayer(): QueryLayer {
  const projectUrl =
    readEnv("SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const apiKey =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!projectUrl || !apiKey) {
    throw new Error(
      "Supabase nije konfiguriran. Postavite SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY za ručni unos."
    );
  }

  return createSupabaseRestQueryLayer({
    projectUrl,
    apiKey
  });
}
