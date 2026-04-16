import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseVoiceDetectionOptions {
  onEmergency: () => void;
  enabled?: boolean;
}

interface UseVoiceDetectionReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceDetection({
  onEmergency,
  enabled = true,
}: UseVoiceDetectionOptions): UseVoiceDetectionReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef(false);
  const onEmergencyRef = useRef(onEmergency);
  const emergencyTriggeredRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onEmergencyRef.current = onEmergency;
  }, [onEmergency]);

  const SpeechRecognitionAPI: SpeechRecognitionConstructor | null =
    typeof window !== "undefined"
      ? ((window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
         (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition ??
         null)
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI || !shouldListenRef.current) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (emergencyTriggeredRef.current) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        if (/\balpha\b/.test(transcript)) {
          emergencyTriggeredRef.current = true;
          shouldListenRef.current = false;
          setIsListening(false);
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* ignore */ }
          }
          onEmergencyRef.current();
          setTimeout(() => {
            emergencyTriggeredRef.current = false;
          }, 10000);
          return;
        }
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current && !emergencyTriggeredRef.current) {
        retryTimerRef.current = setTimeout(() => startRecognition(), 300);
      } else if (!shouldListenRef.current) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
        return;
      }
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (shouldListenRef.current) {
        retryTimerRef.current = setTimeout(() => startRecognition(), 1000);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      if (shouldListenRef.current) {
        retryTimerRef.current = setTimeout(() => startRecognition(), 1000);
      }
    }
  }, [SpeechRecognitionAPI]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    shouldListenRef.current = true;
    startRecognition();
  }, [isSupported, startRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled && isSupported) {
      startListening();
    }
    return () => {
      shouldListenRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, [enabled, isSupported, startListening]);

  return { isListening, isSupported, startListening, stopListening };
}
