import React from 'react';
import { Gem, Award, Search, MessageCircle } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'diamonds' | 'membership';
  onSelectTab: (tab: 'diamonds' | 'membership') => void;
  onOpenTracker: () => void;
  whatsappNumber: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenTracker,
  whatsappNumber,
}) => {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=Hola%20Recargas%20SNK%207,%20deseo%20hacer%20una%20recarga.`;

  return (
    <nav aria-label="Navegación principal móvil" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-t border-zinc-800 px-3 py-1.5">
      <div className="grid grid-cols-4 items-center justify-around h-14">
        
        {/* Opción 1: Tienda (Diamantes) */}
        <button
          onClick={() => onSelectTab('diamonds')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-lg transition-colors cursor-pointer ${
            currentTab === 'diamonds'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Gem className="w-5 h-5" />
          <span className="text-[11px] mt-1">Tienda</span>
        </button>

        {/* Opción 2: Membresías */}
        <button
          onClick={() => onSelectTab('membership')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-lg transition-colors cursor-pointer ${
            currentTab === 'membership'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[11px] mt-1">Membresías</span>
        </button>

        {/* Opción 3: Pedidos */}
        <button
          onClick={onOpenTracker}
          className="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-lg text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[11px] mt-1">Pedidos</span>
        </button>

        {/* Opción 4: WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[11px] mt-1">WhatsApp</span>
        </a>

      </div>
    </nav>
  );
};
