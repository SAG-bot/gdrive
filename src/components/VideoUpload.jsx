import React, { useState } from "react";

export default function VideoUpload({ session, onUpload }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Convert file -> base64 string
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); // remove "data:video/...;base64,"
      reader.onerror = (error) => reject(error);
    });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert("Please select a file and enter a title.");
      return;
    }

    setUploading(true);

    try {
      const base64Video = await toBase64(file);

      const response = await fetch("/.netlify/functions/uploadVideo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          user_id: session?.user?.id || null,
          fileName: file.name,
          fileType: file.type,
          fileData: base64Video,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      alert("Video uploaded successfully!");
      setTitle("");
      setFile(null);

      if (onUpload) onUpload(); // refresh video list
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading video: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleUpload}>
      <input
        type="text"
        placeholder="Video title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Video"}
      </button>
    </form>
  );
}
