"use client";

import { useEffect, useState } from "react";
import { subscribeSpeech, toggleSpeech, stopSpeech } from "@/lib/speech";

export default function ListenButton() {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSpeech((state) => {
      setSpeaking(state);
    });

    return () => {
      unsubscribe();
      stopSpeech();
    };
  }, []);

  return (
    <button
      className={`listen-btn ${speaking ? "on" : ""}`}
      id="listenBtn"
      onClick={toggleSpeech}
      aria-label={speaking ? "Stop narration" : "Listen to this article"}
    >
      <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.6 5.4a9 9 0 0 1 0 13.2" />
      </svg>
      <span>{speaking ? "Stop narration" : "Listen to this article"}</span>
      <span className="bars" aria-hidden="true">
        <i></i><i></i><i></i>
      </span>
    </button>
  );
}
