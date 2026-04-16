import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

type PermStatus = "idle" | "granted" | "denied";

interface Permissions {
  mic: PermStatus;
  camera: PermStatus;
  location: PermStatus;
  downloads: PermStatus;
}

function PermRow({
  icon,
  label,
  sublabel,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: PermStatus;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        status === "granted" ? "bg-green-900/40 border border-green-600" :
        status === "denied"  ? "bg-red-900/40 border border-red-700" :
                               "bg-[#1e1535] border border-[#2d1f4e]"
      }`}>
        <span className={
          status === "granted" ? "text-green-400" :
          status === "denied"  ? "text-red-400" :
                                 "text-[#6b5e8a]"
        }>{icon}</span>
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-semibold ${
          status === "granted" ? "text-green-400" :
          status === "denied"  ? "text-red-400"  :
                                 "text-white"
        }`}>{label}</p>
        <p className="text-xs text-[#6b5e8a]">{sublabel}</p>
      </div>
      <div className="flex-shrink-0">
        {status === "granted" && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-400">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        )}
        {status === "denied" && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        )}
        {status === "idle" && (
          <div className="w-2 h-2 rounded-full bg-[#2d1f4e]" />
        )}
      </div>
    </div>
  );
}

export default function ActivationPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [perms, setPerms] = useState<Permissions>({
    mic: "idle",
    camera: "idle",
    location: "idle",
    downloads: "idle",
  });
  const [requesting, setRequesting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [permsDone, setPermsDone] = useState(false);

  const allGranted = perms.mic === "granted" && perms.camera === "granted";

  const set = (key: keyof Permissions, val: PermStatus) =>
    setPerms((p) => ({ ...p, [key]: val }));

  const requestAll = async () => {
    setRequesting(true);

    // 1. Microphone (for voice detection)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      set("mic", "granted");
    } catch {
      set("mic", "denied");
    }

    // 2. Camera — request front then back so both get cached
    try {
      const front = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      front.getTracks().forEach((t) => t.stop());
      set("camera", "granted");

      // Also warm up back camera
      try {
        const back = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        back.getTracks().forEach((t) => t.stop());
      } catch { /* back camera may not exist on desktop */ }
    } catch {
      set("camera", "denied");
    }

    // 3. Location (for GPS during emergency)
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => { set("location", "granted"); resolve(); },
          () => { set("location", "denied"); resolve(); },
          { timeout: 8000 }
        );
      });
    } catch {
      set("location", "denied");
    }

    // 4. Auto-downloads — trigger two tiny silent downloads so browser asks
    // "Allow automatic downloads from this site?" once, now, not during emergency
    try {
      const silentBlob = new Blob(["resqher"], { type: "text/plain" });
      const triggerDownload = () => {
        const url = URL.createObjectURL(silentBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = ".resqher-permission-check";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 500);
      };
      triggerDownload();
      await new Promise((r) => setTimeout(r, 300));
      triggerDownload(); // second one triggers the "allow automatic downloads" dialog
      set("downloads", "granted");
    } catch {
      set("downloads", "denied");
    }

    setRequesting(false);
    setPermsDone(true);
  };

  const handleActivate = () => {
    setActivating(true);
    setTimeout(() => {
      localStorage.setItem("resqher-activated", "true");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "resqher-activated",
          newValue: "true",
          storageArea: localStorage,
        })
      );
      setLocation("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#9b1d3a] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-3xl font-black text-white tracking-tight">RESQHER</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-[#9b1d3a]/20 border-2 border-[#9b1d3a] mx-auto flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#9b1d3a]">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#16102b] rounded-2xl p-6 border border-[#2d1f4e] shadow-2xl space-y-5">
          <div className="text-center">
            <h2 className="text-base font-bold text-[#a78bca] uppercase tracking-widest mb-1">
              {t("securityActivation")}
            </h2>
            <p className="text-xs text-[#6b5e8a]">
              Grant all permissions now so emergencies trigger instantly
            </p>
          </div>

          {/* Keyword */}
          <div className="bg-[#0d0a1a] border border-[#9b1d3a]/40 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-[#6b5e8a] uppercase tracking-widest mb-1">{t("keyword")}</p>
            <p className="text-3xl font-black text-[#9b1d3a] tracking-[0.3em]">ALPHA</p>
          </div>

          {/* Permission checklist */}
          <div className="bg-[#0d0a1a] rounded-xl px-4 divide-y divide-[#1e1535]">
            <PermRow
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              }
              label="Microphone"
              sublabel="Voice trigger — say ALPHA"
              status={perms.mic}
            />
            <PermRow
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              }
              label="Camera"
              sublabel="Front & back — 30s evidence recording"
              status={perms.camera}
            />
            <PermRow
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              }
              label="Location"
              sublabel="GPS coordinates in SMS alert"
              status={perms.location}
            />
            <PermRow
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              }
              label="Auto-Downloads"
              sublabel="Save videos without prompts"
              status={perms.downloads}
            />
          </div>

          {/* Grant all button */}
          {!permsDone && (
            <button
              onClick={requestAll}
              disabled={requesting}
              className="w-full bg-[#2d1f4e] hover:bg-[#3d2f6e] text-white font-black text-sm py-4 rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {requesting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Requesting permissions…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                  Grant All Permissions
                </>
              )}
            </button>
          )}

          {permsDone && !allGranted && (
            <p className="text-xs text-amber-400 text-center">
              Some permissions were denied. You can still activate, but those features won't work.
            </p>
          )}

          {/* Activate button — shown after permissions step */}
          {permsDone && (
            <button
              data-testid="button-activate"
              onClick={handleActivate}
              disabled={activating}
              className="w-full bg-[#9b1d3a] hover:bg-[#c0254a] active:scale-95 text-white font-black text-lg py-4 rounded-xl transition-all duration-200 disabled:opacity-60 shadow-lg shadow-red-900/30"
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("activating")}
                </span>
              ) : (
                t("activateProtection")
              )}
            </button>
          )}

          {!permsDone && (
            <button
              onClick={handleActivate}
              className="w-full text-xs text-[#4a3d6b] hover:text-[#6b5e8a] transition-colors py-1"
            >
              Skip and activate anyway →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
