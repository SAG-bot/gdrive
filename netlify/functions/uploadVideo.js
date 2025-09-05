import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import Busboy from "busboy";

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Google Drive client
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
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: event.headers });
    const fields = {};
    let fileBuffer = [];

    busboy.on("file", (_, file) => {
      file.on("data", (chunk) => fileBuffer.push(chunk));
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("finish", async () => {
      try {
        const buffer = Buffer.concat(fileBuffer);
        const { title, user_id, fileName, fileType } = fields;

        if (!title || !user_id || !fileName || !buffer.length) {
          return resolve({ statusCode: 400, body: "Missing fields or empty file" });
        }

        // Upload to Google Drive
        const fileRes = await drive.files.create({
          requestBody: { name: fileName, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] },
          media: { mimeType: fileType || "video/mp4", body: BufferToStream(buffer) },
          fields: "id",
        });

        const fileId = fileRes.data.id;

        // Make public
        await drive.permissions.create({ fileId, requestBody: { role: "reader", type: "anyone" } });

        const videoUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        // Insert into Supabase
        const { error } = await supabase.from("videos").insert([
          { title, user_id, video_url: videoUrl },
        ]);
        if (error) throw error;

        resolve({ statusCode: 200, body: JSON.stringify({ videoUrl }) });
      } catch (err) {
        console.error(err);
        resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
      }
    });

    busboy.end(Buffer.from(event.body, "base64"));
  });
};

// Helper: Buffer -> Stream
function BufferToStream(buffer) {
  const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
