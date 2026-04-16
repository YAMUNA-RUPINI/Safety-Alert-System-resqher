import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import i18n from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const [phone, setPhone] = useState(localStorage.getItem("emergencyContact") ?? "");
  const [saved, setSaved] = useState(false);

  const handleSaveContact = () => {
    localStorage.setItem("emergencyContact", phone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("resqher-lang", lang);
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white">
      <header className="border-b border-[#2d1f4e] px-6 py-4 flex items-center gap-4">
        <button
          data-testid="button-back"
          onClick={() => setLocation("/dashboard")}
          className="p-2 rounded-lg hover:bg-[#2d1f4e] text-[#a78bca] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 className="font-black text-xl">{t("settings")}</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-6">
        <div className="bg-[#16102b] rounded-2xl p-6 border border-[#2d1f4e] space-y-4">
          <h2 className="text-sm font-bold text-[#a78bca] uppercase tracking-widest">
            {t("emergencyContact")}
          </h2>
          <p className="text-xs text-[#6b5e8a]">
            This number will receive an SMS when you trigger an emergency alert.
          </p>
          <div className="space-y-3">
            <div>
              <label htmlFor="contact-phone" className="block text-xs font-medium text-[#a78bca] mb-1 uppercase tracking-wider">
                {t("contactPhone")}
              </label>
              <input
                id="contact-phone"
                data-testid="input-contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full bg-[#0d0a1a] border border-[#2d1f4e] rounded-xl px-4 py-3 text-white placeholder-[#4a3d6b] focus:outline-none focus:border-[#9b1d3a] transition-colors"
              />
            </div>
            <button
              data-testid="button-save-contact"
              onClick={handleSaveContact}
              className="w-full bg-[#9b1d3a] hover:bg-[#c0254a] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200"
            >
              {saved ? t("contactSaved") : t("saveContact")}
            </button>
          </div>
        </div>

        <div className="bg-[#16102b] rounded-2xl p-6 border border-[#2d1f4e] space-y-4">
          <h2 className="text-sm font-bold text-[#a78bca] uppercase tracking-widest">
            {t("language")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              data-testid="button-lang-en"
              onClick={() => toggleLanguage("en")}
              className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                i18n.language === "en"
                  ? "bg-[#9b1d3a] text-white border-2 border-[#c0254a]"
                  : "bg-[#0d0a1a] text-[#a78bca] border-2 border-[#2d1f4e] hover:border-[#9b1d3a]"
              }`}
            >
              {t("english")}
            </button>
            <button
              data-testid="button-lang-ta"
              onClick={() => toggleLanguage("ta")}
              className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                i18n.language === "ta"
                  ? "bg-[#9b1d3a] text-white border-2 border-[#c0254a]"
                  : "bg-[#0d0a1a] text-[#a78bca] border-2 border-[#2d1f4e] hover:border-[#9b1d3a]"
              }`}
            >
              {t("tamil")}
            </button>
          </div>
        </div>

        <div className="bg-[#16102b] rounded-2xl p-6 border border-[#2d1f4e] space-y-4">
          <h2 className="text-sm font-bold text-[#a78bca] uppercase tracking-widest">
            {t("profile")}
          </h2>
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                data-testid="img-avatar-settings"
                src={user.photoURL}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-[#9b1d3a]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#9b1d3a] flex items-center justify-center text-sm font-bold">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <p className="font-semibold">{user?.displayName ?? user?.email}</p>
              <p className="text-sm text-[#6b5e8a]">{user?.email}</p>
            </div>
          </div>
          <button
            data-testid="button-signout-settings"
            onClick={handleSignOut}
            className="w-full bg-[#1a0f2e] hover:bg-[#2d1f4e] text-[#a78bca] font-semibold py-3 px-4 rounded-xl transition-all border border-[#2d1f4e]"
          >
            {t("signOut")}
          </button>
        </div>
      </main>
    </div>
  );
}
