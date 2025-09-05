import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function VideoList({ session }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchVideos();

    // Subscribe for real-time refresh on inserts
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
      .select("id, title, video_url, user_id, created_at, likes, comments");

    if (error) {
      console.error("Error fetching videos:", error.message);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const handleLike = async (videoId) => {
    const { data, error } = await supabase
      .from("videos")
      .update({ likes: supabase.rpc("increment_like", { row_id: videoId }) })
      .eq("id", videoId)
      .select();

    if (error) {
      console.error("Like error:", error.message);
    } else {
      fetchVideos();
    }
  };

  const handleAddComment = async (videoId) => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([
        { video_id: videoId, user_id: session.user.id, content: newComment },
      ]);

    if (error) {
      console.error("Comment error:", error.message);
    } else {
      setNewComment("");
      fetchVideos();
    }
  };

  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Delete comment error:", error.message);
    } else {
      fetchVideos();
    }
  };

  const handleDeleteVideo = async (videoId) => {
    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Delete video error:", error.message);
    } else {
      fetchVideos();
    }
  };

  if (loading) return <p>Loading videos...</p>;

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <div className="video-tile" key={video.id}>
          <h3>{video.title}</h3>
          <video
            src={video.video_url}
            controls
            playsInline
            className="video-player"
          />
          <div className="video-actions">
            <button className="like-btn" onClick={() => handleLike(video.id)}>
              ❤️ {video.likes || 0}
            </button>
            {session.user.id === video.user_id && (
              <button
                className="delete-btn"
                onClick={() => handleDeleteVideo(video.id)}
              >
                🗑 Delete
              </button>
            )}
          </div>

          {/* Comments */}
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
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit">💬 Post</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
