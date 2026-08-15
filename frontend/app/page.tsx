'use client';


import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Package, Heart, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [simulatedPaid, setSimulatedPaid] = useState(false);

  const [form, setForm] = useState({
    recipientName: '',
    phoneNumber: '',
    shippingAddress: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Gagal load produk', err));
  }, []);

  const addToCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((prod) => prod.id === Number(id));
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: Object.entries(cart).map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity,
      })),
    };

    const res = await fetch(`${API_BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const order = await res.json();
    setCreatedOrder(order);
  };

  const handleSimulatePayment = async () => {
    if (!createdOrder) return;
    await fetch(`${API_BASE_URL}/api/payment/simulate-pay/${createdOrder.orderCode}`, {
      method: 'POST',
    });
    setSimulatedPaid(true);
  };

  return (
    <div className="min-h-screen bg-pink-50/50 text-slate-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-pink-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            <h1 className="text-xl font-black text-pink-600 tracking-tight">Koleksi Ceria Sekolah</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs font-semibold text-slate-500 hover:text-pink-600">
              Panel Admin ⚙️
            </Link>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-pink-600 transition"
            >
              <ShoppingCart size={18} />
              <span>{totalCartItems} Item (Rp {totalPrice.toLocaleString('id-ID')})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Kembali Ke Sekolah ✨
            </span>
            <h2 className="text-3xl font-extrabold">Alat Tulis & Aksesori Lucu Favorit Si Kecil!</h2>
            <p className="text-pink-100 text-sm max-w-md">
              Koleksi berkualitas, pengiriman cepat & aman langsung ke rumah Bunda.
            </p>
          </div>
          <div className="text-7xl">✏️🎨📎</div>
        </div>
      </section>

      {/* Grid Produk */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Package className="text-pink-500" /> Pilihan Produk Terbaik
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <img 
  src={p.imageUrl} 
  alt={p.name} 
  onError={(e) => {
    // Gambar cadangan jika link utama gagal dimuat
    e.currentTarget.src = "https://images.unsplash.com/photo-1588072432836-e10032774350?w=500";
  }}
  className="w-full h-48 object-cover rounded-2xl mb-4" 
/>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full">
                  {p.category}
                </span>
                <h4 className="font-bold text-slate-800 text-base mt-2">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Harga</span>
                  <span className="text-lg font-black text-pink-600">Rp {p.price.toLocaleString('id-ID')}</span>
                </div>
                <button
                  onClick={() => addToCart(p.id)}
                  className="bg-pink-100 text-pink-600 hover:bg-pink-500 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition"
                >
                  + Keranjang
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Form Checkout & QRIS */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-pink-100 max-h-[90vh] overflow-y-auto">
            {!createdOrder ? (
              <>
                <h2 className="text-2xl font-bold text-pink-600 mb-2">🎀 Alamat Pengiriman</h2>
                <p className="text-xs text-slate-500 mb-4">Mohon lengkapi data penerima agar paket sampai tepat waktu.</p>

                <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nama Penerima / Bunda</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bunda Sarah (Ananda Kenzo)"
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="08123456789"
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Alamat Lengkap Rumah</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Jalan, Nomor Rumah, RT/RW, Kecamatan"
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"
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
                        placeholder="Jakarta Selatan"
                        className="w-full mt-1 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Kode Pos</label>
                      <input
                        type="text"
                        required
                        placeholder="12345"
                        className="w-full mt-1 p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="bg-pink-50 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Total Pembayaran:</span>
                    <span className="text-lg font-black text-pink-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="w-1/2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={totalCartItems === 0}
                      className="w-1/2 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold shadow-md shadow-pink-200"
                    >
                      Bayar via QRIS 💳
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                {!simulatedPaid ? (
                  <>
                    <h3 className="text-xl font-bold text-slate-800">Scan QRIS untuk Bayar</h3>
                    <p className="text-xs text-slate-500">Kode: {createdOrder.orderCode}</p>
                    <div className="flex justify-center p-3 bg-white border-2 border-dashed border-pink-300 rounded-2xl">
                      <img src={createdOrder.qrisUrl} alt="QRIS" className="w-56 h-56" />
                    </div>
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md"
                    >
                      ⚡ Simulasi Bayar Berhasil (Klik Disini)
                    </button>
                  </>
                ) : (
                  <div className="py-6 space-y-3">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                    <h3 className="text-xl font-bold text-slate-800">Pembayaran Berhasil!</h3>
                    <p className="text-xs text-slate-500">
                      Pesanan Anda sudah masuk ke antrean pengiriman. Admin kami akan segera memproses paket ini.
                    </p>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setCreatedOrder(null);
                        setSimulatedPaid(false);
                        setCart({});
                      }}
                      className="w-full py-2.5 bg-pink-500 text-white rounded-xl font-bold text-sm mt-4"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}