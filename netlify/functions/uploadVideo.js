import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import multiparty from "multiparty";
import fs from "fs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Use OAuth2 refresh token flow (better than Service Account for Drive)
const auth = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // redirect URI from setup
);

auth.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Parse multipart form data
    const form = new multiparty.Form();
    const data = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const title = data.fields.title?.[0] || "Untitled";
    const user_id = data.fields.user_id?.[0] || "anonymous";
    const file = data.files.file?.[0];

    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No file uploaded" }),
      };
    }

    // Upload file to Google Drive
    const fileRes = await drive.files.create({
      requestBody: {
        name: file.originalFilename,
        parents: [process.env.DRIVE_FOLDER_ID], // folder you created
      },
      media: {
        mimeType: file.headers["content-type"] || "video/mp4",
        body: fs.createReadStream(file.path),
      },
      fields: "id",
    });

    const fileId = fileRes.data.id;

    // Make file public
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // Direct link for embedding/streaming
    const videoUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Save metadata in Supabase
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
