import { supabase } from "@/lib/supabaseClient"; // adjust path as needed

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'medicare';

export async function uploadStudentPhoto(file: File, prn: string): Promise<string> {
  const filePath = `student_id/${prn}-${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME) // Your bucket name only
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // prevent overwriting
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Generate a public URL for the uploaded file
  const { data: publicUrlData } = supabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Could not generate public URL for uploaded image.");
  }

  return publicUrlData.publicUrl;
}
