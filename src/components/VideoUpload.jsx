import React, { useState } from "react";

export default function VideoUpload({ session, onUpload }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert("Please select a file and enter a title.");
      return;
    }

    setUploading(true);

    try {
      // Build multipart/form-data request
      const formData = new FormData();
      formData.append("title", title);
      formData.append("user_id", session?.user?.id || "anonymous");
      formData.append("file", file);

      const response = await fetch("/.netlify/functions/uploadVideo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      alert("✅ Video uploaded successfully!");
      setTitle("");
      setFile(null);

      if (onUpload) onUpload(); // refresh video list
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Error uploading video: " + err.message);
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
