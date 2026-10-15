/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Product, Order } from '../types';
import { ShoppingCart, Package, CheckCircle2, Minus, Plus, Trash2, X, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import KimaLogo from '../components/KimaLogo';
import { categoryStyle } from '../lib/kima';
import { apiFetch, ApiError, FALLBACK_IMAGE, formatRupiah } from '../lib/api';

type Cart = Record<number, number>;
type Step = 'cart' | 'form' | 'payment' | 'paid';

const CART_KEY = 'kima-cart';
const EMPTY_FORM = {
  recipientName: '',
  phoneNumber: '',
  shippingAddress: '',
  city: '',
  postalCode: '',
  notes: '',
};

const inputClass =
  'w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-kima-pink';

function readSavedCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'slow' | 'ready' | 'error'>('loading');
  const [cart, setCart] = useState<Cart>({});
  const [cartLoaded, setCartLoaded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<Step>('cart');
  const [form, setForm] = useState(EMPTY_FORM);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    // Server gratis bisa "tidur"; beri tahu pembeli jika butuh waktu lama
    const slowTimer = setTimeout(() => setLoadState((s) => (s === 'loading' ? 'slow' : s)), 4000);
    try {
      setProducts(await apiFetch<Product[]>('/api/products'));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    } finally {
      clearTimeout(slowTimer);
    }
  }, []);

  // Muat keranjang tersimpan & produk setelah render pertama (localStorage hanya ada di browser)
  useEffect(() => {
    Promise.resolve().then(() => {
      setCart(readSavedCart());
      setCartLoaded(true);
      loadProducts();
    });
  }, [loadProducts]);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // penyimpanan browser tidak tersedia; keranjang tetap berfungsi selama halaman terbuka
    }
  }, [cart, cartLoaded]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Hanya item yang produknya masih ada, dengan jumlah dibatasi stok terkini
  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: productById.get(Number(id)), qty }))
        .filter((it): it is { product: Product; qty: number } => !!it.product && it.product.stock > 0)
        .map((it) => ({ ...it, qty: Math.min(it.qty, it.product.stock) })),
    [cart, productById]
  );
  const totalCartItems = cartItems.reduce((sum, it) => sum + it.qty, 0);
  const totalPrice = cartItems.reduce((sum, it) => sum + it.product.price * it.qty, 0);

  const setQty = (id: number, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const stock = productById.get(id)?.stock ?? 0;
      const clamped = Math.min(qty, stock);
      if (clamped <= 0) delete next[id];
      else next[id] = clamped;
      return next;
    });
  };

  const openModal = () => {
    setError('');
    if (step === 'paid') setStep('cart');
    setIsModalOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const order = await apiFetch<Order>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          items: cartItems.map((it) => ({ productId: it.product.id, quantity: it.qty })),
        }),
      });
      setCreatedOrder(order);
      setCart({});
      setStep('payment');
      loadProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat pesanan.');
      if (err instanceof ApiError && err.status === 409) loadProducts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!createdOrder) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/payment/simulate-pay/${createdOrder.orderCode}`, { method: 'POST' });
      setStep('paid');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Pembayaran gagal diproses.');
    } finally {
      setSubmitting(false);
    }
  };

  const finishOrder = () => {
    setIsModalOpen(false);
    setCreatedOrder(null);
    setForm(EMPTY_FORM);
    setStep('cart');
  };

  return (
    <div className="min-h-screen flex flex-col bg-kima-cream text-kima-ink">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b-4 border-kima-pink/30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <KimaLogo />
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-kima-pink-deep text-white px-4 py-2 rounded-full font-bold shadow-md hover:brightness-95 transition shrink-0"
          >
            <ShoppingCart size={18} />
            <span>{totalCartItems}</span>
            <span className="hidden sm:inline">Item · {formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </header>

      {/* Banner */}
      <section className="max-w-6xl w-full mx-auto px-4 py-8">
        <div className="relative overflow-hidden bg-linear-to-br from-kima-pink/40 via-kima-lavender/35 to-kima-blue/40 rounded-4xl p-8 md:p-10 shadow-sm border-2 border-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3 relative">
            <span className="bg-white/80 text-kima-pink-deep px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Handmade with love 🎀
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-kima-ink">
              Little Accessories, <span className="text-kima-pink-deep">Big Happiness</span>
            </h2>
            <p className="text-kima-ink/80 text-sm max-w-md">
              Aksesori handmade yang ceria, penuh warna, dan ramah di kantong untuk anak-anak.
            </p>
            <div className="flex gap-2 pt-1">
              {['bg-kima-pink', 'bg-kima-yellow', 'bg-kima-lavender', 'bg-kima-mint', 'bg-kima-blue'].map((c) => (
                <span key={c} className={`w-4 h-4 rounded-full border-2 border-white ${c}`} />
              ))}
            </div>
          </div>
          <div className="text-6xl md:text-7xl">🎀⭐💖</div>
        </div>
      </section>

      {/* Grid Produk */}
      <main className="max-w-6xl w-full mx-auto px-4 pb-16 flex-1">
        <h3 className="font-display text-2xl font-bold text-kima-ink mb-6 flex items-center gap-2">
          <Package className="text-kima-pink-deep" /> Koleksi Kima
        </h3>

        {(loadState === 'loading' || loadState === 'slow') && (
          <div>
            {loadState === 'slow' && (
              <p className="mb-4 text-sm bg-kima-yellow/30 text-kima-ink px-4 py-3 rounded-2xl">
                🧸 Toko sedang disiapkan, mohon tunggu sebentar (bisa sampai 1 menit)...
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border-2 border-kima-pink/10 animate-pulse">
                  <div className="h-48 rounded-2xl bg-kima-lavender/20 mb-4" />
                  <div className="h-3 w-20 rounded-full bg-kima-pink/20 mb-3" />
                  <div className="h-4 w-3/4 rounded-full bg-slate-100 mb-2" />
                  <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        )}

        {loadState === 'error' && (
          <div className="bg-white border-2 border-kima-pink/20 rounded-3xl p-10 text-center space-y-3">
            <p className="text-4xl">😿</p>
            <p className="font-display text-lg font-semibold">Produk belum bisa dimuat</p>
            <p className="text-sm text-slate-500">Periksa koneksi internet kamu, lalu coba lagi.</p>
            <button
              onClick={() => {
                setLoadState('loading');
                loadProducts();
              }}
              className="inline-flex items-center gap-2 bg-kima-pink-deep text-white px-5 py-2.5 rounded-xl font-bold text-sm"
            >
              <RefreshCw size={16} /> Coba Lagi
            </button>
          </div>
        )}

        {loadState === 'ready' && products.length === 0 && (
          <p className="text-center text-slate-500 py-10">Koleksi baru segera hadir! 🎀</p>
        )}

        {loadState === 'ready' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => {
              const inCart = cart[p.id] ?? 0;
              const soldOut = p.stock <= 0;
              const maxed = !soldOut && inCart >= p.stock;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-4 shadow-sm border-2 border-kima-pink/20 hover:border-kima-pink/50 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative">
                      <img
                        src={p.imageUrl || FALLBACK_IMAGE}
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        className={`w-full h-48 object-cover rounded-2xl mb-4 ${soldOut ? 'grayscale opacity-60' : ''}`}
                      />
                      {soldOut && (
                        <span className="absolute top-3 left-3 bg-kima-ink text-white text-xs font-bold px-3 py-1 rounded-full">
                          Stok Habis
                        </span>
                      )}
                      {!soldOut && p.stock <= 5 && (
                        <span className="absolute top-3 left-3 bg-kima-yellow text-kima-ink text-xs font-bold px-3 py-1 rounded-full">
                          Sisa {p.stock}!
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryStyle(p.category)}`}>
                      {p.category}
                    </span>
                    <h4 className="font-display font-semibold text-kima-ink text-base mt-2">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Harga</span>
                      <span className="text-lg font-black text-kima-pink-deep">{formatRupiah(p.price)}</span>
                    </div>
                    <button
                      onClick={() => setQty(p.id, inCart + 1)}
                      disabled={soldOut || maxed}
                      className="bg-kima-mint/35 text-kima-ink hover:bg-kima-mint disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed px-4 py-2 rounded-xl font-bold text-sm transition"
                    >
                      {soldOut ? 'Habis' : maxed ? 'Maks. stok' : inCart > 0 ? `+ Lagi (${inCart})` : '+ Keranjang'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t-4 border-kima-lavender/30 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Kima Little Collection · Little Accessories, Big Happiness</span>
          <Link href="/admin" className="hover:text-kima-pink-deep">
            Masuk Admin
          </Link>
        </div>
      </footer>

      {/* Modal Keranjang, Alamat & QRIS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-kima-lavender/40 max-h-[90vh] overflow-y-auto">
            {step === 'cart' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-2xl font-bold text-kima-pink-deep">🛍️ Keranjang</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Tutup">
                    <X size={20} />
                  </button>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-8">Keranjang masih kosong. Yuk pilih aksesori favorit! 🎀</p>
                ) : (
                  <ul className="space-y-3">
                    {cartItems.map(({ product, qty }) => (
                      <li key={product.id} className="flex items-center gap-3 bg-kima-cream rounded-2xl p-2.5">
                        <img
                          src={product.imageUrl || FALLBACK_IMAGE}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{product.name}</div>
                          <div className="text-xs text-kima-pink-deep font-bold">{formatRupiah(product.price * qty)}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setQty(product.id, qty - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                            aria-label="Kurangi"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold">{qty}</span>
                          <button
                            onClick={() => setQty(product.id, qty + 1)}
                            disabled={qty >= product.stock}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40"
                            aria-label="Tambah"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => setQty(product.id, 0)}
                            className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center ml-1"
                            aria-label="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="bg-kima-yellow/25 p-3 rounded-2xl flex justify-between items-center mt-4">
                  <span className="text-xs font-bold text-slate-700">Total ({totalCartItems} item)</span>
                  <span className="text-lg font-black text-kima-pink-deep">{formatRupiah(totalPrice)}</span>
                </div>
                <button
                  onClick={() => setStep('form')}
                  disabled={cartItems.length === 0}
                  className="w-full mt-4 py-2.5 bg-kima-pink-deep hover:brightness-95 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-kima-pink/40"
                >
                  Lanjut Isi Alamat →
                </button>
              </>
            )}

            {step === 'form' && (
              <>
                <button onClick={() => setStep('cart')} className="flex items-center gap-1 text-xs text-slate-500 mb-3 hover:text-kima-pink-deep">
                  <ArrowLeft size={14} /> Kembali ke keranjang
                </button>
                <h2 className="font-display text-2xl font-bold text-kima-pink-deep mb-1">🎀 Alamat Pengiriman</h2>
                <p className="text-xs text-slate-500 mb-4">Mohon lengkapi data penerima agar paket sampai tepat waktu.</p>

                <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nama Penerima</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Contoh: Bunda Sarah (Ananda Kenzo)"
                      className={inputClass}
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      pattern="[0-9+\- ]{8,20}"
                      title="Masukkan nomor WhatsApp yang valid"
                      placeholder="08123456789"
                      className={inputClass}
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Alamat Lengkap Rumah</label>
                    <textarea
                      required
                      rows={2}
                      maxLength={500}
                      placeholder="Jalan, Nomor Rumah, RT/RW, Kecamatan"
                      className={inputClass}
                      value={form.shippingAddress}
                      onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Kota / Kabupaten</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Jakarta Selatan"
                        className={inputClass}
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Kode Pos</label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{5}"
                        title="Kode pos 5 digit"
                        placeholder="12345"
                        className={inputClass}
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Catatan (opsional)</label>
                    <input
                      type="text"
                      maxLength={255}
                      placeholder="Contoh: nama di gelang 'ALYA', warna pink"
                      className={inputClass}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>

                  <div className="bg-kima-yellow/25 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Total Pembayaran:</span>
                    <span className="text-lg font-black text-kima-pink-deep">{formatRupiah(totalPrice)}</span>
                  </div>

                  {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting || cartItems.length === 0}
                    className="w-full py-2.5 bg-kima-pink-deep hover:brightness-95 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-kima-pink/40"
                  >
                    {submitting ? 'Memproses...' : 'Bayar via QRIS 💳'}
                  </button>
                </form>
              </>
            )}

            {step === 'payment' && createdOrder && (
              <div className="text-center py-2 space-y-4">
                <h3 className="font-display text-xl font-bold text-kima-ink">Scan QRIS untuk Bayar</h3>
                <p className="text-xs text-slate-500">
                  Kode pesanan: <span className="font-mono font-bold">{createdOrder.orderCode}</span>
                </p>
                <p className="text-2xl font-black text-kima-pink-deep">{formatRupiah(createdOrder.totalAmount)}</p>
                <div className="flex justify-center p-3 bg-white border-2 border-dashed border-kima-lavender rounded-2xl">
                  <img src={createdOrder.qrisUrl} alt="QRIS" className="w-56 h-56" />
                </div>
                {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</p>}
                <button
                  onClick={handleSimulatePayment}
                  disabled={submitting}
                  className="w-full py-2.5 bg-kima-mint hover:brightness-95 disabled:opacity-50 text-kima-ink rounded-xl font-bold text-sm shadow-md"
                >
                  {submitting ? 'Memproses...' : '⚡ Simulasi Bayar Berhasil'}
                </button>
                <p className="text-[11px] text-slate-400">Mode demo: pembayaran QRIS belum terhubung ke payment gateway.</p>
              </div>
            )}

            {step === 'paid' && createdOrder && (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 size={48} className="text-kima-mint-deep mx-auto" />
                <h3 className="font-display text-xl font-bold text-kima-ink">Pembayaran Berhasil! 🎉</h3>
                <p className="text-xs text-slate-500">
                  Pesanan <span className="font-mono font-bold">{createdOrder.orderCode}</span> sudah masuk antrean pengiriman.
                  Simpan kode ini, ya. Kami akan mengabari lewat WhatsApp saat paket dikirim.
                </p>
                <button onClick={finishOrder} className="w-full py-2.5 bg-kima-pink-deep text-white rounded-xl font-bold text-sm mt-4">
                  Kembali Belanja
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
