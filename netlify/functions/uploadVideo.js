import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const drive = google.drive({
  version: "v3",
  auth: new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive.file"]
  ),
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { title, user_id, fileName, fileType, fileData } = JSON.parse(
      event.body
    );

    if (!fileName || !fileData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing file data or name" }),
      };
    }

    // Convert base64 -> Buffer
    const buffer = Buffer.from(fileData, "base64");

    // Upload to Google Drive
    const fileRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // make sure you created a folder & set ID
      },
      media: {
        mimeType: fileType || "video/mp4",
        body: bufferToStream(buffer),
      },
      fields: "id",
    });

    const fileId = fileRes.data.id;

    // Make file public
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // Public video URL
    const videoUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Insert into Supabase
    const { error: dbError } = await supabase.from("videos").insert([
      {
        title,
        user_id,
        video_url: videoUrl,
      },
    ]);

    if (dbError) throw dbError;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Video uploaded", videoUrl }),
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

// helper to turn Buffer into ReadableStream
function bufferToStream(buffer) {
  const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
