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
