"use client";

import { useState } from "react";
import { CRISIS_RESOURCES, CrisisLevel } from "@/lib/crisis-detection";

interface CrisisResourcesBannerProps {
  level: CrisisLevel;
  onDismiss: () => void;
  isDarkMode: boolean;
}

export default function CrisisResourcesBanner({ level, onDismiss, isDarkMode }: CrisisResourcesBannerProps) {
  const [isExpanded, setIsExpanded] = useState(level === "crisis");

  if (level === "none") return null;

  const isCrisis = level === "crisis";
  
  const overlayBg = "bg-black/50";
  
  const cardBg = isDarkMode
    ? isCrisis ? "bg-[#1a0f0f] border-red-800" : "bg-[#1a1508] border-amber-800"
    : isCrisis ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300";
  
  const textColor = isDarkMode
    ? isCrisis ? "text-red-200" : "text-amber-200"
    : isCrisis ? "text-red-800" : "text-amber-800";

  const iconColor = isDarkMode
    ? isCrisis ? "text-red-400" : "text-amber-400"
    : isCrisis ? "text-red-600" : "text-amber-600";

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${overlayBg} animate-in fade-in duration-200`}>
      <div className={`max-w-lg w-full rounded-2xl border p-6 shadow-2xl ${cardBg} animate-in zoom-in-95 duration-300`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 ${iconColor}`}>
            {isCrisis ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${textColor}`}>
              {isCrisis ? "We're here for you" : "Support is available"}
            </h3>
            <p className={`text-sm mt-2 opacity-90 ${textColor}`}>
              {isCrisis
                ? "If you're in crisis, please reach out to a professional who can help. You don't have to face this alone."
                : "If you're feeling overwhelmed, know that support is always available."}
            </p>

            {/* Toggle resources */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-sm mt-3 underline underline-offset-2 hover:opacity-80 ${textColor}`}
            >
              {isExpanded ? "Hide resources" : "Show crisis helplines"}
            </button>

            {/* Resources list */}
            {isExpanded && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {CRISIS_RESOURCES.map((resource, idx) => (
                  <div key={idx} className={`text-sm ${textColor} opacity-90`}>
                    <span className="font-medium">{resource.country}:</span>{" "}
                    {resource.name} — <span className="font-mono">{resource.phone}</span>
                    <span className="opacity-70 ml-1">({resource.description})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 p-2 rounded-lg hover:opacity-70 transition-opacity ${textColor}`}
            aria-label="Dismiss"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Dismiss button at bottom */}
        <button
          onClick={onDismiss}
          className={`w-full mt-6 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            isDarkMode 
              ? "bg-white/10 hover:bg-white/20 text-white" 
              : "bg-black/10 hover:bg-black/20 text-gray-800"
          }`}
        >
          I understand, continue
        </button>
      </div>
    </div>
  );
}
