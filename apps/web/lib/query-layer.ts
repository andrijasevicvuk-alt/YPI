import {
  createSupabaseRestQueryLayer,
  type QueryLayer
} from "@ypi/data-access";

function readEnv(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createServerQueryLayer(): QueryLayer {
  const projectUrl =
    readEnv(process.env.SUPABASE_URL) ??
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const apiKey =
    readEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  console.log("URL:", projectUrl);
  console.log("KEY exists:", !!apiKey);

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
