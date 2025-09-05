import React, { useState } from "react";

export default function VideoUpload({ user, onUpload }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return alert("Please select a file and enter a title.");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("user_id", user.id);
      formData.append("fileName", file.name);
      formData.append("fileType", file.type);
      formData.append("video", file);

      const response = await fetch("/.netlify/functions/uploadVideo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");

      alert("Video uploaded!");
      setTitle("");
      setFile(null);
      onUpload(); // refresh video list
    } catch (err) {
      console.error(err);
      alert("Error uploading video: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="upload-form">
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
