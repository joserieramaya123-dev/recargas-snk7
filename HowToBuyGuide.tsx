import React from 'react';
import { ShoppingCart, UserCheck, CreditCard, Eye, FileCheck, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const HowToBuyGuide: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Elige tu Producto',
      desc: 'Selecciona la cantidad de diamantes o membresía VIP que desees y pulsa COMPRAR.',
      icon: ShoppingCart,
    },
    {
      num: '2',
      title: 'Tu ID de Free Fire',
      desc: 'Ingresa tu ID numérico. ¡Jamás solicitaremos contraseñas ni correos!',
      icon: UserCheck,
    },
    {
      num: '3',
      title: 'Datos de Pago Móvil',
      desc: 'Consulta los datos de Pago Móvil oficial en Bolívares (Bs.) y transfiere el monto exacto.',
      icon: CreditCard,
    },
    {
      num: '4',
      title: 'Transfiere el Monto',
      desc: 'Copia los datos de cuenta oficiales de RECARGAS SNK 7 con un solo toque.',
      icon: Eye,
    },
    {
      num: '5',
      title: 'Sube tu Comprobante',
      desc: 'Adjunta la captura del pago y escribe el número de referencia para verificación.',
      icon: FileCheck,
    },
    {
      num: '6',
      title: '¡Recarga Acreditada!',
      desc: 'Recibes tu código de orden SNK y puedes notificar por WhatsApp para entrega express.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-12 border-t border-slate-800/80 bg-[#06080d]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Title */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guía Paso a Paso</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ¿Cómo Recargar en RECARGAS SNK 7?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Proceso 100% transparente y automatizado. Diseñado para que recargues desde tu teléfono Android o computadora en menos de 2 minutos.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="p-4 rounded-2xl bg-[#090d16] border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex gap-3.5"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 font-black text-sm">
                  {st.num}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{st.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & FAQs box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0b1220] to-[#090d16] border border-cyan-500/30 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Garantía Anti-Baneo y Seguridad de Cuenta</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Las recargas se realizan directamente a través de los sistemas oficiales autorizados por Garena mediante tu ID numérico. No usamos métodos de terceros no autorizados, hacks ni mods, garantizando que tu cuenta permanezca 100% segura y protegida.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Tiempo de Entrega & Horario de Atención</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Una vez que el administrador verifica tu comprobante de Pago Móvil, la acreditación de los diamantes toma entre <strong className="text-cyan-300">5 a 15 minutos</strong>. El soporte por WhatsApp está activo los 7 días de la semana.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
