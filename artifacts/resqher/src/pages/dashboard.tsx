import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceDetection } from "@/hooks/useVoiceDetection";
import { useEmergency } from "@/hooks/useEmergency";
import { useEmergencyHistory } from "@/hooks/useEmergencyHistory";
import i18n from "@/lib/i18n";

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(false);
  const [inIframe] = useState(() => isInIframe());
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");

  const { triggerEmergency, isTriggering, statusMessage } = useEmergency(
    user?.uid,
    user?.displayName
  );

  const { emergencies, loading: historyLoading } = useEmergencyHistory(user?.uid);

  const handleEmergency = useCallback(async () => {
    setShowEmergencyOverlay(true);
    await triggerEmergency();
  }, [triggerEmergency]);

  const { isListening, isSupported } = useVoiceDetection({
    onEmergency: handleEmergency,
    enabled: !!user && !inIframe,
  });

  useEffect(() => {
    if (inIframe) return;
    navigator.permissions?.query({ name: "microphone" as PermissionName }).then((result) => {
      setMicPermission(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "unknown");
      result.onchange = () => {
        setMicPermission(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "unknown");
      };
    }).catch(() => setMicPermission("unknown"));
  }, [inIframe]);

  const handleSignOut = async () => {
    localStorage.removeItem("resqher-activated");
    await signOut();
    setLocation("/");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ta" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("resqher-lang", newLang);
  };

  const openInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  const getStatusStep = () => {
    switch (statusMessage) {
      case "getting-location": return t("gettingLocation");
      case "starting-camera": return t("startingCamera");
      case "sending-alert": return t("sendingAlert");
      case "sent": return "Emergency alert sent successfully";
      case "failed": return t("alertFailed");
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white">
      {showEmergencyOverlay && (
        <div className="fixed inset-0 z-50 bg-red-900/95 flex flex-col items-center justify-center px-6 animate-pulse-once">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 rounded-full bg-red-500 mx-auto flex items-center justify-center animate-ping-once">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight uppercase">
              {t("emergencyOverlay")}
            </h2>
            <p className="text-red-200 text-lg">{t("emergencyDesc")}</p>
            {getStatusStep() && (
              <p className="text-red-300 text-sm animate-pulse">{getStatusStep()}</p>
            )}
            <button
              data-testid="button-dismiss-emergency"
              onClick={() => setShowEmergencyOverlay(false)}
              className="mt-6 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Iframe warning banner */}
      {inIframe && (
        <div className="bg-amber-900/80 border-b border-amber-600 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-200 text-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-amber-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Voice & camera require the app to be opened in a full browser tab.</span>
          </div>
          <button
            onClick={openInNewTab}
            className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
            Open in New Tab
          </button>
        </div>
      )}

      <header className="border-b border-[#2d1f4e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#9b1d3a] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-black text-xl text-white tracking-tight">RESQHER</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="button-evidence"
            onClick={() => setLocation("/evidence")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2d1f4e] hover:bg-[#3d2a66] text-[#a78bca] transition-colors"
          >
            {t("viewEvidence")}
          </button>
          <button
            data-testid="button-language-toggle"
            onClick={toggleLanguage}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2d1f4e] hover:bg-[#3d2a66] text-[#a78bca] transition-colors"
          >
            {i18n.language === "en" ? "TA" : "EN"}
          </button>
          <button
            data-testid="button-settings"
            onClick={() => setLocation("/settings")}
            className="p-2 rounded-lg hover:bg-[#2d1f4e] text-[#a78bca] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <img
                data-testid="img-avatar"
                src={user.photoURL}
                alt="avatar"
                className="w-8 h-8 rounded-full border-2 border-[#9b1d3a]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#9b1d3a] flex items-center justify-center text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <button
              data-testid="button-signout"
              onClick={handleSignOut}
              className="text-xs text-[#6b5e8a] hover:text-[#a78bca] transition-colors"
            >
              {t("signOut")}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-[#16102b] rounded-2xl p-6 border border-[#2d1f4e]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[#a78bca] uppercase tracking-widest mb-1">
                {t("profile")}
              </h2>
              <p data-testid="text-username" className="text-xl font-bold text-white">
                {user?.displayName ?? user?.email ?? "User"}
              </p>
              <p className="text-sm text-[#6b5e8a]">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Voice status — disabled in iframe */}
        {inIframe ? (
          <div className="rounded-2xl p-5 border-2 bg-[#16102b] border-[#2d1f4e]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-900/30 border-2 border-amber-700 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-500">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-amber-400">Voice listener blocked in preview</p>
                <p className="text-xs text-[#6b5e8a] mt-0.5">Open app in a new tab to enable "ALPHA" voice trigger</p>
              </div>
              <button
                onClick={openInNewTab}
                className="text-xs font-bold px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white transition-colors"
              >
                Open →
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl p-5 border-2 ${
            micPermission === "denied"
              ? "bg-red-950/30 border-red-800"
              : isListening
              ? "bg-green-950/40 border-green-700"
              : "bg-[#16102b] border-[#2d1f4e]"
          } transition-all duration-300`}>
            <div className="flex items-center gap-4">
              <div className={`relative flex-shrink-0 ${isListening ? "animate-pulse" : ""}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  micPermission === "denied"
                    ? "bg-red-900/30 border-2 border-red-700"
                    : isListening
                    ? "bg-green-500/20 border-2 border-green-500"
                    : "bg-gray-700/20 border-2 border-gray-600"
                }`}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${
                    micPermission === "denied" ? "text-red-500" : isListening ? "text-green-400" : "text-gray-500"
                  }`}>
                    <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V21h2v-2.28c3.28-.49 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                </div>
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="flex-1">
                <p data-testid="status-voice" className={`font-bold text-base ${
                  micPermission === "denied" ? "text-red-400" : isListening ? "text-green-400" : "text-gray-500"
                }`}>
                  {!isSupported
                    ? t("voiceNotSupported")
                    : micPermission === "denied"
                    ? "Microphone blocked — voice trigger disabled"
                    : isListening
                    ? t("listeningStatus")
                    : t("notListening")}
                </p>
                {isSupported && micPermission !== "denied" && (
                  <p className="text-xs text-[#6b5e8a] mt-0.5">
                    {t("voiceDetectionActive")}
                  </p>
                )}
                {micPermission === "denied" && (
                  <p className="text-xs text-red-400 mt-0.5">
                    Allow microphone in browser settings and refresh
                  </p>
                )}
              </div>
              {isListening && (
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-green-400 rounded-full animate-bounce"
                      style={{ height: `${12 + i * 6}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          data-testid="button-trigger-emergency"
          onClick={handleEmergency}
          disabled={isTriggering}
          className="w-full bg-[#9b1d3a] hover:bg-[#c0254a] active:scale-95 text-white font-black text-xl py-6 rounded-2xl transition-all duration-200 disabled:opacity-60 shadow-lg shadow-red-900/30 border-2 border-[#c0254a]/50"
        >
          {isTriggering ? (getStatusStep() ?? "...") : t("manualTrigger")}
        </button>

        <div className="bg-[#16102b] rounded-2xl border border-[#2d1f4e] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2d1f4e] flex items-center justify-between">
            <h3 className="font-bold text-white">{t("emergencyHistory")}</h3>
            <button
              onClick={() => setLocation("/evidence")}
              className="text-xs text-[#a78bca] hover:text-white transition-colors"
            >
              {t("viewEvidence")} →
            </button>
          </div>
          <div className="divide-y divide-[#2d1f4e]">
            {historyLoading ? (
              <div className="px-6 py-8 text-center text-[#6b5e8a] text-sm">Loading...</div>
            ) : emergencies.length === 0 ? (
              <div className="px-6 py-8 text-center text-[#6b5e8a] text-sm">
                {t("noHistory")}
              </div>
            ) : (
              emergencies.slice(0, 5).map((item) => (
                <div
                  data-testid={`card-emergency-${item.id}`}
                  key={item.id}
                  className="px-6 py-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9b1d3a]">
                      {t("triggered")}
                    </span>
                    <span className="text-xs text-[#6b5e8a]">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <a
                    data-testid={`link-location-${item.id}`}
                    href={item.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#a78bca] hover:text-white underline transition-colors"
                  >
                    {t("viewLocation")}
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
