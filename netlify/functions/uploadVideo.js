import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { title, user_id, fileData, fileName } = JSON.parse(event.body);

    if (!title || !user_id || !fileData || !fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // ✅ Google Drive auth
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/drive.file"]
    );

    const drive = google.drive({ version: "v3", auth });

    // ✅ Convert base64 string back into a buffer
    const buffer = Buffer.from(fileData, "base64");

    // ✅ Upload to Google Drive
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: "video/mp4",
        body: buffer,
      },
      fields: "id",
    });

    const fileId = uploadResponse.data.id;

    // ✅ Make file public
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;

    // ✅ Save metadata in Supabase
    const { error: dbError } = await supabase.from("videos").insert([
      {
        title,
        video_url: publicUrl,
        user_id,
      },
    ]);

    if (dbError) throw dbError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Video uploaded successfully 🎉",
        videoUrl: publicUrl,
      }),
    };
  } catch (error) {
    console.error("Upload error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Upload failed",
        details: error.message,
      }),
    };
  }
}
