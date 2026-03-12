import { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function uploadStartupLogo(
  supabase: SupabaseClient,
  file: File,
  startupId: string
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: PNG, JPEG, WebP, SVG");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 2MB");
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${startupId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from("startup-logos")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("startup-logos")
    .getPublicUrl(path);

  return urlData.publicUrl;
}
