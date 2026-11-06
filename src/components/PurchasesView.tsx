import React, { useMemo, useState } from 'react';
import { Search, ShoppingBag, Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { PINTUCO_PRODUCTS } from '../data/pintucoCatalog';
import { PintucoProduct } from '../types';
import { formatCOP } from '../utils/calculator';

type CartLine = { product: PintucoProduct; package: 'gallon' | 'bucket'; quantity: number };

export const PurchasesView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const products = useMemo(() => PINTUCO_PRODUCTS.filter((product) =>
    (category === 'all' || product.category === category) &&
    `${product.name} ${product.line} ${product.description}`.toLowerCase().includes(query.toLowerCase())
  ), [query, category]);
  const total = cart.reduce((sum, line) => sum + line.quantity * (line.package === 'gallon' ? line.product.pricePerGallonCOP : line.product.pricePerBucketCOP), 0);
  const add = (product: PintucoProduct, pack: CartLine['package']) => setCart((items) => {
    const found = items.find((item) => item.product.id === product.id && item.package === pack);
    return found ? items.map((item) => item === found ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { product, package: pack, quantity: 1 }];
  });
  const updateQty = (index: number, delta: number) => setCart((items) => items.map((line, i) => i === index ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));

  return <div className="space-y-6 pb-12 animate-in fade-in duration-300">
    <section className="rounded-2xl bg-gradient-to-r from-[#1E216B] to-[#3439A3] p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300"><ShoppingBag className="h-4 w-4"/> Catálogo oficial Pintuco</div>
      <h2 className="mt-2 text-2xl font-black">Compras de pinturas y recubrimientos</h2>
      <p className="mt-1 text-sm text-blue-100">Consulta productos y precios por galón y cuñete. Los precios son los configurados en el catálogo de ColorLink.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pintura, línea o uso…" className="w-full rounded-xl border border-white/20 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"/></label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/20 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
          <option value="all">Todas las categorías</option>{Array.from(new Set(PINTUCO_PRODUCTS.map((p) => p.category))).map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
        </select>
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => <article key={product.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-800">{product.category.replaceAll('_', ' ')}</span><Package className="h-5 w-5 text-amber-500"/></div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{product.line}</p><h3 className="mt-1 text-base font-black text-slate-900">{product.name}</h3>
          <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">{product.description}</p>
          <p className="mt-3 text-[11px] text-slate-500">Rendimiento: {product.coveragePerGallon} m²/galón · {product.recommendedCoats} manos recomendadas</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => add(product, 'gallon')} className="rounded-xl border border-slate-200 p-2 text-left hover:border-blue-400 hover:bg-blue-50"><span className="block text-[10px] font-bold text-slate-500">Galón</span><strong className="text-sm text-slate-900">{formatCOP(product.pricePerGallonCOP)}</strong><span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-700"><Plus className="h-3 w-3"/>Agregar</span></button>
            <button onClick={() => add(product, 'bucket')} className="rounded-xl border border-slate-200 p-2 text-left hover:border-blue-400 hover:bg-blue-50"><span className="block text-[10px] font-bold text-slate-500">Cuñete · 5 gal</span><strong className="text-sm text-slate-900">{formatCOP(product.pricePerBucketCOP)}</strong><span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-700"><Plus className="h-3 w-3"/>Agregar</span></button>
          </div>
        </article>)}
        {!products.length && <p className="rounded-xl bg-white p-5 text-sm text-slate-500">No hay pinturas que coincidan con la búsqueda.</p>}
      </div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-40"><h3 className="flex items-center gap-2 font-black text-slate-900"><ShoppingCart className="h-4 w-4 text-blue-700"/>Tu selección</h3>
        {!cart.length ? <p className="mt-4 text-sm text-slate-500">Agrega productos para ver el resumen del pedido.</p> : <div className="mt-4 space-y-3">{cart.map((line, index) => <div key={`${line.product.id}-${line.package}`} className="border-b border-slate-100 pb-3"><p className="text-xs font-bold text-slate-800">{line.product.name}</p><div className="mt-1 flex items-center justify-between text-xs text-slate-500"><span>{line.package === 'gallon' ? 'Galón' : 'Cuñete'} · {formatCOP(line.package === 'gallon' ? line.product.pricePerGallonCOP : line.product.pricePerBucketCOP)}</span><span className="flex items-center gap-2"><button aria-label="Restar" onClick={() => updateQty(index, -1)}><Minus className="h-3 w-3"/></button>{line.quantity}<button aria-label="Sumar" onClick={() => updateQty(index, 1)}><Plus className="h-3 w-3"/></button></span></div></div>)}<div className="flex justify-between pt-1 text-sm font-black"><span>Total estimado</span><span>{formatCOP(total)}</span></div><p className="text-[10px] text-slate-400">Resumen referencial. La compra y disponibilidad se confirman con el asesor Pintuco.</p></div>}
      </aside>
    </div>
  </div>;
};
