import { useState } from "react";

export default function VideoUpload({ user, refresh }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    const title = e.target.title.value;

    if (!file) return alert("Select a file");

    setUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Data = reader.result.split(",")[1];

      const res = await fetch("/.netlify/functions/uploadVideo", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64Data,
          title,
          user_id: user.id,
        }),
      });

      setUploading(false);
      if (res.ok) {
        alert("Uploaded!");
        refresh();
      } else {
        alert("Upload failed");
      }
    };
  };

  return (
    <form onSubmit={handleUpload} className="upload-form">
      <input type="text" name="title" placeholder="Video title" required />
      <input type="file" name="file" accept="video/*" required />
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Video"}
      </button>
    </form>
  );
}
