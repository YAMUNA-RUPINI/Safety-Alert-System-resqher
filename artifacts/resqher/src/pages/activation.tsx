import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function ActivationPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [activating, setActivating] = useState(false);

  const handleActivate = () => {
    setActivating(true);
    setTimeout(() => {
      localStorage.setItem("resqher-activated", "true");
      setLocation("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#9b1d3a] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-3xl font-black text-white tracking-tight">RESQHER</span>
          </div>
          <div className="w-20 h-20 rounded-full bg-[#9b1d3a]/20 border-2 border-[#9b1d3a] mx-auto flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#9b1d3a]">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
        </div>

        <div className="bg-[#16102b] rounded-2xl p-8 border border-[#2d1f4e] shadow-2xl space-y-6 text-center">
          <div>
            <h2 className="text-lg font-bold text-[#a78bca] uppercase tracking-widest mb-3">
              {t("securityActivation")}
            </h2>
            <p className="text-white text-base leading-relaxed">
              {t("activationMessage")}
            </p>
          </div>

          <div className="bg-[#0d0a1a] border border-[#9b1d3a]/50 rounded-xl px-6 py-5">
            <p className="text-xs text-[#6b5e8a] uppercase tracking-widest mb-2">{t("keyword")}</p>
            <p className="text-4xl font-black text-[#9b1d3a] tracking-[0.3em]">ALPHA</p>
          </div>

          <p className="text-sm text-[#6b5e8a]">
            {t("activationSubtext")}
          </p>

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
        </div>
      </div>
    </div>
  );
}
