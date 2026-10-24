import React from 'react';
import { HERO_BANNER_IMG } from '../services/storage';

interface HeroProps {
  bannerUrl?: string;
  showBanner?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ bannerUrl, showBanner = true }) => {
  if (!showBanner) return null;

  const currentBanner = bannerUrl || HERO_BANNER_IMG;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1">
      {/* Banner visual pequeño y discreto que no empuja los productos hacia abajo */}
      <div className="relative w-full h-24 sm:h-32 md:h-36 rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 shadow-md">
        <img
          src={currentBanner}
          alt="Banner RECARGAS SNK 7"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            // Fallback si la imagen personalizada falla
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center px-4 sm:px-6">
          <div className="space-y-0.5">
            <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase tracking-widest block font-mono">
              TIENDA OFICIAL FREE FIRE
            </span>
            <h1 className="text-base sm:text-xl font-black text-white tracking-tight">
              Recargas Directas por ID
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};
