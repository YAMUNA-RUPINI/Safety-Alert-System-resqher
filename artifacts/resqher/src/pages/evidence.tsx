import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useEmergencyHistory } from "@/hooks/useEmergencyHistory";

export default function EvidencePage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { emergencies, loading } = useEmergencyHistory(user?.uid);

  return (
    <div className="min-h-screen bg-[#0d0a1a] text-white">
      <header className="border-b border-[#2d1f4e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation("/dashboard")}
            className="p-2 rounded-lg hover:bg-[#2d1f4e] text-[#a78bca] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <span className="font-black text-xl text-white tracking-tight">{t("evidencePage")}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        <p className="text-sm text-[#6b5e8a]">{t("evidenceDesc")}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#9b1d3a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : emergencies.length === 0 ? (
          <div className="bg-[#16102b] rounded-2xl border border-[#2d1f4e] px-6 py-12 text-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-[#2d1f4e] mx-auto mb-4">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p className="text-[#6b5e8a] text-sm">{t("noEvidenceRecords")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencies.map((item) => (
              <div
                key={item.id}
                data-testid={`card-evidence-${item.id}`}
                className="bg-[#16102b] rounded-2xl border border-[#2d1f4e] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#9b1d3a]">
                    {t("emergencyEvent")}
                  </span>
                  <span className="text-xs text-[#6b5e8a]">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                <a
                  data-testid={`link-location-evidence-${item.id}`}
                  href={item.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a78bca] hover:text-white transition-colors group"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="underline group-hover:no-underline">{t("viewLocation")}</span>
                </a>

                {item.localVideoPath ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#6b5e8a] uppercase tracking-widest">{t("recordedVideos")}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.localVideoPath.split(",").filter(Boolean).map((path, idx) => (
                        <a
                          key={idx}
                          href={path}
                          download={`resqher-evidence-${item.id}-${idx + 1}.webm`}
                          className="flex items-center gap-1.5 bg-[#0d0a1a] border border-[#2d1f4e] hover:border-[#9b1d3a] text-[#a78bca] hover:text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                          </svg>
                          {t("downloadVideo")} {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#4a3d6b] italic">{t("noVideoSaved")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
