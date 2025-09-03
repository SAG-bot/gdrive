import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

// Supabase setup
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body);
    const { fileName, fileContent, title, user_id } = body;

    if (!fileName || !fileContent) {
      return { statusCode: 400, body: "Missing file data" };
    }

    // Google Auth
    const auth = new google.auth.JWT({
      email: process.env.GDRIVE_CLIENT_EMAIL,
      key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Upload file to Drive
    const fileRes = await drive.files.create({
      requestBody: { name: fileName, parents: [process.env.GDRIVE_FOLDER_ID] },
      media: {
        mimeType: "video/mp4",
        body: Buffer.from(fileContent, "base64"),
      },
    });

    const fileId = fileRes.data.id;

    // Make file public
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const videoUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

    // Insert into Supabase
    const { error } = await supabase.from("videos").insert([
      { title, video_url: videoUrl, user_id },
    ]);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Upload successful", videoUrl }),
    };
  } catch (err) {
    console.error("Upload error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
}
