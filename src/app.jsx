import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import VideoUpload from "./components/VideoUpload";
import VideoList from "./components/VideoList";
import "./style.css";

const affirmations = [
  "You are loved 💙",
  "You are strong 💪",
  "You inspire me 🌸",
  "You make life brighter 🌞",
  "You’re doing amazing 🌈",
  "I believe in you ✨",
  "You are enough 💜",
  "You radiate beauty 🌷",
  "You matter 🌍",
  "I’m proud of you 🦋",
  "You’re magical 🌟",
  "Your smile lights up my world 💕",
  "You’re unstoppable 🚀",
  "You are precious 💎",
  "I’m grateful for you 🌼",
  "You bring peace 🕊",
  "You’re brave 🦁",
  "You are inspiring 🌹",
  "You make me happy 🎶",
  "You’re my favorite person 🌻",
];

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(supabase.auth.getSession());
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div>
      {!session ? (
        <Login onLogin={setSession} />
      ) : (
        <>
          <div className="header">
            <h1>💜 Our Private Vlog 💙</h1>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>

          <div className="affirmations">
            {affirmations[Math.floor(Math.random() * affirmations.length)]}
          </div>

          <VideoUpload user={session.user} refresh={() => window.location.reload()} />
          <VideoList user={session.user} />
        </>
      )}
    </div>
  );
}
