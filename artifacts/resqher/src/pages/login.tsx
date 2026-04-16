import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithEmail, registerWithEmail, error } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      await signInWithEmail(email, password);
    } else {
      await registerWithEmail(email, password);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0a1a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#9b1d3a] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {t("appName")}
            </h1>
          </div>
          <p className="text-[#a78bca] text-sm font-medium tracking-widest uppercase">
            {t("tagline")}
          </p>
        </div>

        <div className="bg-[#16102b] rounded-2xl p-8 border border-[#2d1f4e] shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            data-testid="button-google-signin"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? "Redirecting..." : t("signInWithGoogle")}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2d1f4e]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#16102b] px-3 text-[#6b5e8a]">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#a78bca] mb-1 uppercase tracking-wider">
                {t("email")}
              </label>
              <input
                id="email"
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0d0a1a] border border-[#2d1f4e] rounded-xl px-4 py-3 text-white placeholder-[#4a3d6b] focus:outline-none focus:border-[#9b1d3a] transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#a78bca] mb-1 uppercase tracking-wider">
                {t("password")}
              </label>
              <input
                id="password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#0d0a1a] border border-[#2d1f4e] rounded-xl px-4 py-3 text-white placeholder-[#4a3d6b] focus:outline-none focus:border-[#9b1d3a] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              data-testid="button-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-[#9b1d3a] hover:bg-[#c0254a] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? t("login") : t("createAccount")}
            </button>
          </form>

          <div className="text-center">
            {mode === "login" ? (
              <p className="text-sm text-[#6b5e8a]">
                {t("dontHaveAccount")}{" "}
                <button
                  data-testid="button-switch-register"
                  onClick={() => setMode("register")}
                  className="text-[#a78bca] hover:text-white font-semibold transition-colors"
                >
                  {t("register")}
                </button>
              </p>
            ) : (
              <p className="text-sm text-[#6b5e8a]">
                {t("alreadyHaveAccount")}{" "}
                <button
                  data-testid="button-switch-login"
                  onClick={() => setMode("login")}
                  className="text-[#a78bca] hover:text-white font-semibold transition-colors"
                >
                  {t("login")}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
