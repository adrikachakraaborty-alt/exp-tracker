import { createBrowserClient } from "@supabase/ssr";

// `any` is deliberate here: this small personal app does not use generated
// Supabase types. Replace it with generated Database types if the schema grows.
export const supabase = () => createBrowserClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
