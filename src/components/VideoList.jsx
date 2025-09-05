import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function VideoList({ user }) {
  const [videos, setVideos] = useState([]);

  const fetchVideos = async () => {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setVideos(data || []);
  };

  useEffect(() => {
    fetchVideos();

    const channel = supabase
      .channel("videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, fetchVideos)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleDelete = async (videoId) => {
    const { error } = await supabase.from("videos").delete().eq("id", videoId).eq("user_id", user.id);
    if (error) console.error(error);
    else fetchVideos();
  };

  return (
    <div className="video-grid">
      {videos.map((v) => (
        <div key={v.id} className="video-tile">
          <h3>{v.title}</h3>
          <video src={v.video_url} controls className="video-player" />
          {v.user_id === user.id && (
            <button onClick={() => handleDelete(v.id)}>🗑 Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}
