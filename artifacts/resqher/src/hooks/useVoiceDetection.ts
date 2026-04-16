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

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        if (transcript.includes("alpha")) {
          onEmergencyRef.current();
        }
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        setTimeout(() => startRecognition(), 500);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        if (shouldListenRef.current) {
          setTimeout(() => startRecognition(), 1000);
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [SpeechRecognitionAPI]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    shouldListenRef.current = true;
    startRecognition();
  }, [isSupported, startRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enabled, isSupported, startListening]);

  return { isListening, isSupported, startListening, stopListening };
}
