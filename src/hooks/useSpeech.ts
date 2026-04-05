"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type AssistantLanguage } from "@/lib/translations";

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeech() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [language, setLanguage] = useState<AssistantLanguage>("en");
  const [isReady, setIsReady] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const lastTextRef = useRef<string | null>(null);

  // Initialize
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const savedMute = localStorage.getItem("assistantMute") === "true";
    const savedLang = (localStorage.getItem("assistantLang") as AssistantLanguage) || "en";
    
    setIsEnabled(!savedMute);
    setLanguage(savedLang);

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      if (voicesRef.current.length > 0) {
        setIsReady(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("assistantMute", (!next).toString());
      if (!next) window.speechSynthesis.cancel();
      return next;
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === "en" ? "es" : "en";
      localStorage.setItem("assistantLang", next);
      window.speechSynthesis.cancel();
      return next;
    });
  }, []);

  const speak = useCallback(
    (text: string, options?: SpeechOptions) => {
      if (!isEnabled || !isReady || typeof window === "undefined") return;

      // Avoid repeating the exact same thing twice in a row immediately
      if (text === lastTextRef.current && window.speechSynthesis.speaking) {
        return;
      }

      window.speechSynthesis.cancel(); // Interrupt current speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "en" ? "en-US" : "es-ES";
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      // Select the "best" voice
      const preferredPrefixes = language === "en" 
        ? ["Google US English", "Samantha", "Tessa", "Daniel"] 
        : ["Google Español", "Monica", "Jorge", "Zuzana"];

      const voice = voicesRef.current.find((v) => 
        v.lang.startsWith(language) && preferredPrefixes.some(p => v.name.includes(p))
      ) || voicesRef.current.find((v) => v.lang.startsWith(language));

      if (voice) {
        utterance.voice = voice;
      }

      lastTextRef.current = text;
      window.speechSynthesis.speak(utterance);
    },
    [isEnabled, isReady, language]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    isEnabled,
    language,
    toggleEnabled,
    toggleLanguage,
    speak,
    stop,
    isReady,
  };
}
