import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uploadInput = z.object({
  fileName: z.string().min(1).max(120),
  contentType: z.string().regex(/^image\/(png|jpeg|jpg|gif|webp)$/),
  /** Base64-encoded image payload, max ~2MB once decoded. */
  data: z.string().min(1).max(3_000_000),
});

/** Uploads a token logo and returns its public URL. */
export const uploadTokenImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => uploadInput.parse(data))
  .handler(async ({ data }) => {
    const bytes = Buffer.from(data.data, "base64");
    if (bytes.byteLength > 2_000_000) {
      throw new Error("Image must be 2MB or smaller");
    }

    const ext = data.fileName.split(".").pop()?.toLowerCase().slice(0, 5) ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("token-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });

    if (error) throw new Error(error.message);

    const { data: pub } = supabaseAdmin.storage.from("token-images").getPublicUrl(path);
    return { url: pub.publicUrl };
  });
