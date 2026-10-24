import React from 'react';
import { Product } from '../types';
import { Gem, Award } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onBuy,
}) => {
  const isMembership = product.type === 'membership';

  return (
    <div className="rounded-2xl bg-[#090b10] border border-zinc-800/90 hover:border-cyan-500/40 p-3 sm:p-4 transition-colors flex flex-col justify-between">
      {/* 1. Imagen del paquete */}
      <div className="relative w-full aspect-square max-h-40 sm:max-h-44 rounded-xl overflow-hidden bg-black/50 border border-zinc-900 mb-3 flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-cyan-950/40 flex items-center justify-center text-cyan-400">
            {isMembership ? <Award className="w-7 h-7" /> : <Gem className="w-7 h-7" />}
          </div>
        )}

        {/* Etiqueta sutil si tiene bono o es pase */}
        {product.bonus && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/80 text-cyan-300 border border-cyan-500/30 font-mono">
            {product.bonus}
          </span>
        )}
      </div>

      {/* 2. Cantidad de diamantes y Nombre */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-cyan-400">
          {isMembership ? (
            <Award className="w-4 h-4 text-cyan-400" />
          ) : (
            <Gem className="w-4 h-4 text-cyan-400" />
          )}
          <span className="text-base sm:text-lg font-bold text-white tracking-wide font-mono">
            {product.diamonds.toLocaleString('de-DE')} {isMembership ? 'Diamantes' : 'Diamantes'}
          </span>
        </div>
        <h3 className="text-xs text-slate-400 font-medium">
          {product.name}
        </h3>
      </div>

      {/* 3. Precio */}
      <div className="pt-2 border-t border-zinc-900 mb-3 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-medium">Precio</span>
          <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono tracking-tight">
            {product.priceBs.toLocaleString('de-DE')} <span className="text-xs font-bold text-slate-300">Bs.</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block uppercase font-medium">Métodos</span>
          <span className="text-xs font-semibold text-cyan-400 font-mono">
            Pago Móvil / USDT
          </span>
        </div>
      </div>

      {/* 4. Botón COMPRAR grande y fácil de pulsar */}
      <button
        type="button"
        onClick={() => onBuy(product)}
        className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-zinc-950 font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md shadow-cyan-950/40 cursor-pointer min-h-[48px] flex items-center justify-center"
      >
        COMPRAR
      </button>
    </div>
  );
};
