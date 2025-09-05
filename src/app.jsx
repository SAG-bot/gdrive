import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import VideoUpload from "./components/VideoUpload";
import VideoList from "./components/VideoList";
import "./style.css";

const affirmations = [
  "You are loved 💙",
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
  "You are precious 💎",
  "I’m grateful for you 🌼",
  "You bring peace 🕊",
  "You are inspiring 🌹",
  "You make me happy 🎶",
  "You’re my favorite person 🌻",
];

export default function App() {
  const [session, setSession] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false); // triggers video refetch

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const t
