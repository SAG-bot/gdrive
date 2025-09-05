import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function VideoList({ session, refreshFlag }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    fetchVideos();
  }, [refreshFlag]); // <-- refetch when refreshFlag changes

  useEffect(() => {
    // Optional real-time subscription
    const channel = supabase
      .channel("videos-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "videos" },
        (payload) => {
          setVideos((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select(`
        id,
        title,
        video_url,
        user_id,
        created_at,
        comments(id, content, user_id)
      `)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching videos:", error.message);
    else setVideos(data || []);

    setLoading(false);
  };

  const handleAddComment = async (videoId) => {
    const content = commentInputs[videoId]?.trim();
    if (!content) return;

    const { error } = await supabase.from("comments").insert([
      { video_id: videoId, user_id: session.user.id, content },
    ]);

    if (!error) {
      setCommentInputs((prev) => ({ ...prev, [videoId]: "" }));
      fetchVideos();
    }
  };

  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", session.user.id);

    if (!error) fetchVideos();
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      const res = await fetch("/.netlify/functions/deleteVideo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, user_id: session.user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchVideos();
    } catch (err) {
      console.error("Delete video error:", err.message);
      alert("Error deleting video: " + err.message);
    }
  };

  if (loading) return <p>Loading videos...</p>;

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <div className="video-tile" key={video.id}>
          <h3>{video.title}</h3>
          <video src={video.video_url} controls playsInline className="video-player" />
          <div className="video-actions">
            {session.user.id === video.user_id && (
              <button className="delete-btn" onClick={() => handleDeleteVideo(video.id)}>
                🗑 Delete
              </button>
            )}
          </div>

          <div className="comments">
            <h4>Comments</h4>
            {video.comments && video.comments.length > 0 ? (
              video.comments.map((c) => (
                <div key={c.id} className="comment">
                  <span>{c.content}</span>
                  {c.user_id === session.user.id && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      ✖
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>No comments yet</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment(video.id);
              }}
            >
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInputs[video.id] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({ ...prev, [video.id]: e.target.value }))
                }
              />
              <button type="submit">💬 Post</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
