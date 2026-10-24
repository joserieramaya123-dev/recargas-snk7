import React from 'react';
import { Search, Lock } from 'lucide-react';

interface NavbarProps {
  storeLogoUrl?: string;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  storeLogoUrl,
  onOpenTracker,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
          
          {/* Logo y Nombre de la Tienda (Únicamente logo y nombre, sin eslóganes) */}
          <div className="flex items-center gap-2.5">
            {storeLogoUrl ? (
              <img
                src={storeLogoUrl}
                alt="Logo RECARGAS SNK 7"
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-cyan-500/40 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1.5px] shrink-0 shadow-md shadow-cyan-950/40">
                <div className="w-full h-full bg-[#090d16] rounded-[6.5px] flex items-center justify-center">
                  <span className="font-black text-cyan-400 tracking-tighter text-xs sm:text-sm font-mono">
                    SNK7
                  </span>
                </div>
              </div>
            )}
            
            <span className="text-base sm:text-lg font-black tracking-wide text-white uppercase whitespace-nowrap">
              RECARGAS <span className="text-cyan-400">SNK 7</span>
            </span>
          </div>

          {/* Accesos pequeños: Seguimiento de pedidos y Administrador */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 rounded-lg active:scale-95 transition-all cursor-pointer"
              title="Consultar estado de tu recarga"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rastrear</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg active:scale-95 transition-all cursor-pointer"
              title="Acceso administrativo protegido"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
