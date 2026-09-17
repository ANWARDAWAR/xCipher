import { showToast } from "./utils";

let isSpeaking = false;
const listeners = new Set<(speaking: boolean) => void>();

export function subscribeSpeech(fn: (speaking: boolean) => void) {
  listeners.add(fn);
  fn(isSpeaking);
  return () => {
    listeners.delete(fn);
  };
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  listeners.forEach((fn) => fn(false));
}

export function toggleSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    showToast("Audio narration isn't supported in this browser");
    return;
  }

  if (isSpeaking) {
    stopSpeech();
    showToast("Stopped narration");
    return;
  }

  const prose = document.getElementById("prose");
  const text = prose ? prose.innerText.replace(/\s+/g, " ").slice(0, 6000) : "";
  if (!text) {
    showToast("No article text found");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  utterance.pitch = 1;

  utterance.onend = () => {
    isSpeaking = false;
    listeners.forEach((fn) => fn(false));
  };

  utterance.onerror = () => {
    isSpeaking = false;
    listeners.forEach((fn) => fn(false));
  };

  isSpeaking = true;
  listeners.forEach((fn) => fn(true));
  window.speechSynthesis.speak(utterance);
  showToast("Narrating article…");
}
