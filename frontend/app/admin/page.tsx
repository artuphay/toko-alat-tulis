/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Product, Order, OrderSummary } from '../../types';
import Link from 'next/link';
import KimaLogo from '../../components/KimaLogo';
import AdminLogin from '../../components/AdminLogin';
import { categoryStyle, KIMA_CATEGORIES } from '../../lib/kima';
import { apiFetch, ApiError, FALLBACK_IMAGE, formatRupiah } from '../../lib/api';
import { ShoppingBag, Plus, Trash2, Edit3, Truck, ArrowLeft, Upload, Link as LinkIcon, LogOut, PackageCheck } from 'lucide-react';

const TOKEN_KEY = 'kima-admin-token';
const EMPTY_FORM = {
  name: '',
  category: KIMA_CATEGORIES[0],
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
};
const inputClass =
  'w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-kima-pink';

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // penyimpanan browser tidak tersedia; admin perlu login ulang setelah refresh
  }
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<'checking' | 'loggedOut' | 'loggedIn'>('checking');
  const [token, setToken] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState('');

  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('products');
  const [orderView, setOrderView] = useState<'ready' | 'shipped'>('ready');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary>({
    readyToShipOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0,
  });
  const [connectionError, setConnectionError] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Image Upload Options ('file' atau 'url')
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (type: 'ok' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const logout = useCallback((notice = '') => {
    writeToken(null);
    setToken(null);
    setLoginNotice(notice);
    setAuthState('loggedOut');
  }, []);

  const handleLogin = (newToken: string) => {
    writeToken(newToken);
    setToken(newToken);
    setLoginNotice('');
    setAuthState('loggedIn');
  };

  // Panggilan API admin: token otomatis disertakan, sesi habis -> kembali ke layar login
  const adminApi = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      try {
        return await apiFetch<T>(path, init, token);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) logout(err.message);
        throw err;
      }
    },
    [token, logout]
  );

  // Cek token tersimpan saat halaman dibuka
  useEffect(() => {
    const saved = readToken();
    if (!saved) {
      Promise.resolve().then(() => setAuthState('loggedOut'));
      return;
    }
    apiFetch('/api/admin/session', {}, saved)
      .then(() => {
        setToken(saved);
        setAuthState('loggedIn');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          writeToken(null);
          setAuthState('loggedOut');
        } else {
          // Server belum bisa dihubungi; tetap masuk dan biarkan polling mencoba lagi
          setToken(saved);
          setAuthState('loggedIn');
        }
      });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [prod, ready, shipped, sum] = await Promise.all([
        apiFetch<Product[]>('/api/products'),
        adminApi<Order[]>('/api/admin/orders/ready-to-ship'),
        adminApi<Order[]>('/api/admin/orders/shipped'),
        adminApi<OrderSummary>('/api/admin/orders/summary'),
      ]);
      setProducts(prod);
      setReadyOrders(ready);
      setShippedOrders(shipped);
      setSummary(sum);
      setConnectionError(false);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setConnectionError(true);
    }
  }, [adminApi]);

  useEffect(() => {
    if (authState !== 'loggedIn') return;
    let active = true;
    const load = () => {
      if (active) fetchData();
    };
    load();
    const interval = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authState, fetchData]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setImageUploadMode('file');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      description: p.description || '',
      price: p.price.toString(),
      stock: p.stock.toString(),
      imageUrl: p.imageUrl || '',
    });
    setFormError('');
    setImageUploadMode(p.imageUrl?.includes('/api/images/') ? 'file' : 'url');
    setIsModalOpen(true);
  };

  // Handler Upload File dari Komputer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 5 MB');
      return;
    }

    setUploadingImage(true);
    setFormError('');
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const data = await adminApi<{ url: string }>('/api/admin/upload', { method: 'POST', body: uploadFormData });
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal mengupload foto');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      imageUrl: formData.imageUrl.trim() || FALLBACK_IMAGE,
    };

    try {
      if (editingProduct) {
        await adminApi(`/api/admin/products/${editingProduct.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminApi('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      showToast('ok', editingProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
      fetchData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await adminApi(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      showToast('ok', 'Produk dihapus');
      fetchData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'Gagal menghapus produk');
    }
  };

  const handleShip = async (id: number) => {
    const resi = trackingInputs[id]?.trim();
    if (!resi) {
      showToast('error', 'Silakan isi nomor resi ekspedisi!');
      return;
    }
    try {
      await adminApi(`/api/admin/orders/${id}/ship`, {
        method: 'PUT',
        body: JSON.stringify({ trackingNumber: resi }),
      });
      showToast('ok', 'Pesanan ditandai sudah dikirim 🚚');
      fetchData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'Gagal memperbarui pesanan');
    }
  };

  if (authState === 'checking') {
    return <div className="min-h-screen bg-kima-cream flex items-center justify-center text-sm text-slate-500">Memuat...</div>;
  }

  if (authState === 'loggedOut') {
    return <AdminLogin notice={loginNotice} onLogin={handleLogin} />;
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
      active
        ? 'bg-kima-pink-deep text-white shadow-md shadow-kima-pink/40'
        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
    }`;

  return (
    <div className="min-h-screen bg-kima-cream p-4 sm:p-6 md:p-10 font-sans text-kima-ink">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-5">
            <KimaLogo showTagline={false} />
            <div className="pl-5 border-l-2 border-kima-pink/30">
              <h1 className="font-display text-2xl font-bold text-kima-ink">Panel Pengelola Toko</h1>
              <p className="text-xs text-slate-500">Kelola stok aksesori & monitor pesanan siap kirim.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-kima-pink/10 transition shadow-sm"
            >
              <ArrowLeft size={16} /> Ke Toko
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>

        {connectionError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3.5 rounded-2xl text-xs">
            ⚠️ <strong>Belum terhubung ke server.</strong> Server mungkin sedang bangun (bisa sampai 1 menit). Data akan dimuat ulang otomatis.
          </div>
        )}

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-kima-pink/20 border-2 border-kima-pink/40 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-kima-pink-deep uppercase">Total Produk</span>
            <div className="text-2xl font-black text-kima-ink mt-1 font-display">{summary.totalProducts} Item</div>
          </div>
          <div className="bg-kima-mint/20 border-2 border-kima-mint/50 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-kima-mint-deep uppercase">Siap Dikirim (Lunas)</span>
            <div className="text-2xl font-black text-kima-ink mt-1 font-display">{summary.readyToShipOrders} Pesanan</div>
          </div>
          <div className="bg-kima-yellow/25 border-2 border-kima-yellow/60 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-kima-yellow-deep uppercase">Menunggu QRIS</span>
            <div className="text-2xl font-black text-kima-ink mt-1 font-display">{summary.pendingOrders} Pesanan</div>
          </div>
          <div className="bg-kima-blue/20 border-2 border-kima-blue/50 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-kima-blue-deep uppercase">Terkirim</span>
            <div className="text-2xl font-black text-kima-ink mt-1 font-display">{summary.shippedOrders} Pesanan</div>
          </div>
        </div>

        {/* Navigasi Tab */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button onClick={() => setActiveTab('products')} className={tabClass(activeTab === 'products')}>
            <ShoppingBag size={16} /> Kelola Produk & Stok ({products.length})
          </button>
          <button onClick={() => setActiveTab('orders')} className={tabClass(activeTab === 'orders')}>
            <Truck size={16} /> Pesanan ({readyOrders.length} siap kirim)
          </button>
        </div>

        {/* TAB 1: MANAJEMEN PRODUK */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Daftar Katalog Produk</h3>
                <p className="text-xs text-slate-400">Tambah barang baru dengan foto atau perbarui stok.</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-1.5 bg-kima-pink-deep hover:brightness-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
              >
                <Plus size={16} /> Tambah Produk Baru
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full min-w-160 text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Foto & Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Harga</th>
                    <th className="p-3.5">Stok</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={p.imageUrl || FALLBACK_IMAGE}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                          <div className="text-slate-400 text-[11px] line-clamp-1 max-w-xs">{p.description}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${categoryStyle(p.category)}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{formatRupiah(p.price)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            p.stock > 10
                              ? 'bg-kima-mint/30 text-kima-mint-deep'
                              : p.stock > 0
                              ? 'bg-kima-yellow/40 text-kima-yellow-deep'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {p.stock > 0 ? `${p.stock} Unit` : 'Stok Habis'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Produk"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Produk"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PESANAN */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex gap-2">
              <button
                onClick={() => setOrderView('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${orderView === 'ready' ? 'bg-white shadow text-kima-pink-deep' : 'text-slate-500'}`}
              >
                Siap Dikirim ({readyOrders.length})
              </button>
              <button
                onClick={() => setOrderView('shipped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${orderView === 'shipped' ? 'bg-white shadow text-kima-pink-deep' : 'text-slate-500'}`}
              >
                Sudah Dikirim ({shippedOrders.length})
              </button>
            </div>

            {(orderView === 'ready' ? readyOrders : shippedOrders).length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                {orderView === 'ready' ? 'Tidak ada pesanan yang menunggu pengiriman saat ini.' : 'Belum ada pesanan yang dikirim.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(orderView === 'ready' ? readyOrders : shippedOrders).map((o) => (
                  <div key={o.id} className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'SHIPPED' ? 'bg-kima-blue/25 text-kima-blue-deep' : 'bg-kima-mint/30 text-kima-mint-deep'
                        }`}
                      >
                        {o.status === 'SHIPPED' ? 'DIKIRIM' : 'LUNAS (QRIS)'}
                      </span>
                      <p className="text-[11px] font-mono text-slate-400">{o.orderCode}</p>
                      <h3 className="font-bold text-slate-800 text-base">{o.recipientName}</h3>
                      <p className="text-xs text-slate-500 font-mono">📱 {o.phoneNumber}</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                        📍 {o.shippingAddress}, {o.city} ({o.postalCode})
                      </p>
                      {o.notes && <p className="text-xs text-slate-600 bg-kima-yellow/20 p-2.5 rounded-xl">📝 {o.notes}</p>}
                    </div>

                    <div className="md:w-1/3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Barang:</span>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {o.items?.map((it) => (
                          <li key={it.id} className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                            <span>
                              {it.quantity}x {it.productName}
                            </span>
                            <span className="font-medium">{formatRupiah(it.subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 text-right font-black text-sm text-kima-pink-deep">Total: {formatRupiah(o.totalAmount)}</div>
                    </div>

                    <div className="md:w-1/3 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      {o.status === 'SHIPPED' ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <PackageCheck size={14} /> Nomor Resi
                          </span>
                          <p className="font-mono text-sm font-bold">{o.trackingNumber}</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">Nomor Resi Ekspedisi</label>
                            <input
                              type="text"
                              placeholder="Contoh: JNE12345678"
                              className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-kima-blue bg-white"
                              value={trackingInputs[o.id] || ''}
                              onChange={(e) => setTrackingInputs({ ...trackingInputs, [o.id]: e.target.value })}
                            />
                          </div>
                          <button
                            onClick={() => handleShip(o.id)}
                            className="mt-3 w-full py-2 bg-kima-blue-deep hover:brightness-95 text-white rounded-lg text-xs font-bold transition shadow"
                          >
                            Konfirmasi Kirim 🚚
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL INPUT / EDIT PRODUK DENGAN FITUR UPLOAD GAMBAR */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-kima-lavender/40 max-h-[90vh] overflow-y-auto">
              <h2 className="font-display text-xl font-bold text-kima-ink mb-1">
                {editingProduct ? '✏️ Edit Produk' : '✨ Tambah Produk Baru'}
              </h2>
              <p className="text-xs text-slate-400 mb-4">Lengkapi rincian aksesori Kima.</p>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nama Produk</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="Contoh: Jepit Rambut Pita Pelangi"
                    className={inputClass}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Kategori</label>
                  <select
                    className={`${inputClass} bg-white`}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {/* Pertahankan kategori lama yang tidak ada di daftar agar tidak hilang saat edit */}
                    {!KIMA_CATEGORIES.includes(formData.category) && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                    {KIMA_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      placeholder="15000"
                      className={inputClass}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Jumlah Stok</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1}
                      placeholder="50"
                      className={inputClass}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                </div>

                {/* BAGIAN UPLOAD FOTO / LINK */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Foto Produk</label>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('file')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                          imageUploadMode === 'file' ? 'bg-white shadow text-kima-pink-deep' : 'text-slate-500'
                        }`}
                      >
                        <Upload size={12} /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                          imageUploadMode === 'url' ? 'bg-white shadow text-kima-pink-deep' : 'text-slate-500'
                        }`}
                      >
                        <LinkIcon size={12} /> Link URL
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === 'file' ? (
                    <div className="border-2 border-dashed border-kima-lavender rounded-2xl p-4 text-center hover:bg-kima-lavender/10 transition relative">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFileChange}
                        disabled={uploadingImage}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-1">
                        <Upload className="mx-auto text-kima-pink-deep" size={24} />
                        <div className="text-xs font-bold text-slate-700">
                          {uploadingImage ? 'Mengupload ke Server...' : 'Klik untuk Pilih Foto'}
                        </div>
                        <p className="text-[10px] text-slate-400">PNG, JPG, WEBP, atau GIF · maks. 5 MB</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://..."
                      className={inputClass}
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  )}

                  {/* Pratinjau Foto */}
                  {formData.imageUrl && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <img src={formData.imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <div className="overflow-hidden flex-1">
                        <span className="text-[10px] font-bold text-kima-mint-deep">✓ Foto Siap Digunakan</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-60">{formData.imageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="text-[10px] text-rose-500 font-bold px-2"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Contoh: Bahan lembut, warna tahan luntur..."
                    className={inputClass}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {formError && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">{formError}</p>}

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage || saving}
                    className="w-1/2 py-2.5 bg-kima-pink-deep hover:brightness-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-kima-pink/40"
                  >
                    {uploadingImage ? 'Mengupload...' : saving ? 'Menyimpan...' : 'Simpan Produk 💾'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-60 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold ${
              toast.type === 'ok' ? 'bg-kima-mint text-kima-ink' : 'bg-rose-500 text-white'
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}
