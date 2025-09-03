import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function VideoList({ user }) {
  const [videos, setVideos] = useState([]);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, video_url, user_id, created_at, likes (id), comments (id, content, user_id)")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setVideos(data);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id, ownerId) => {
    if (user.id !== ownerId) return alert("Not your video!");
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (!error) fetchVideos();
  };

  const handleLike = async (videoId) => {
    const { error } = await supabase.from("likes").insert([
      { video_id: videoId, user_id: user.id },
    ]);
    if (error) console.error(error);
    fetchVideos();
  };

  const handleComment = async (videoId, content) => {
    if (!content) return;
    const { error } = await supabase.from("comments").insert([
      { video_id: videoId, content, user_id: user.id },
    ]);
    if (!error) fetchVideos();
  };

  const handleDeleteComment = async (commentId, ownerId) => {
    if (user.id !== ownerId) return alert("Not your comment!");
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) fetchVideos();
  };

  return (
    <div className="video-grid">
      {videos.map((v) => (
        <div key={v.id} className="video-tile">
          <h3>{v.title}</h3>
          <video src={v.video_url} controls playsInline />

          <div className="tile-actions">
            <button className="like-btn" onClick={() => handleLike(v.id)}>
              ❤️ {v.likes?.length || 0}
            </button>
            {user.id === v.user_id && (
              <button className="delete-btn" onClick={() => handleDelete(v.id, v.user_id)}>
                🗑 Delete
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="comments">
            {v.comments?.map((c) => (
              <div key={c.id} className="comment-item">
                <span>{c.content}</span>
                {user.id === c.user_id && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteComment(c.id, c.user_id)}
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleComment(v.id, e.target.comment.value);
                e.target.reset();
              }}
            >
              <input type="text" name="comment" placeholder="Write a comment..." />
              <button type="submit">💬</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
