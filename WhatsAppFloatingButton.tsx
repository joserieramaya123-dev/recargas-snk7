import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  whatsappNumber: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  whatsappNumber,
}) => {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleanPhone}?text=Hola%20Recargas%20SNK%207!%20Deseo%20hacer%20una%20recarga%20de%20Free%20Fire.`;

  return (
    <aside aria-label="Soporte y contacto" className="hidden md:block fixed bottom-6 right-6 z-30">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/80 active:scale-95 transition-all"
        title="Chatear con soporte en WhatsApp (+58 416-7301856)"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950" />
        </div>
        <span className="hidden sm:inline font-bold">WhatsApp Directo</span>
        <span className="sm:hidden font-bold">Soporte</span>
      </a>
    </aside>
  );
};
