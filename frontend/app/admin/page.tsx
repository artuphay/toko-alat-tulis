/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Product, Order } from '../../types';
import Link from 'next/link';
import { ShoppingBag, Plus, Trash2, Edit3, Truck, ArrowLeft, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('products');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({
    readyToShipOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0,
  });
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<{ [key: number]: string }>({});

  // Image Upload Options ('file' atau 'url')
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Alat Tulis',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [resProd, resOrd, resSum] = await Promise.all([
        fetch('http://localhost:8080/api/products'),
        fetch('http://localhost:8080/api/admin/orders/ready-to-ship'),
        fetch('http://localhost:8080/api/admin/orders/summary'),
      ]);

      if (resProd.ok && resOrd.ok && resSum.ok) {
        setProducts(await resProd.json());
        setOrders(await resOrd.json());
        setSummary(await resSum.json());
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (isSubscribed) await fetchData();
    };
    load();
    const interval = setInterval(load, 8000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Alat Tulis',
      description: '',
      price: '',
      stock: '',
      imageUrl: '',
    });
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
    setImageUploadMode(p.imageUrl?.startsWith('http://localhost:8080') ? 'file' : 'url');
    setIsModalOpen(true);
  };

  // Handler Upload File dari Komputer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await fetch('http://localhost:8080/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) throw new Error('Upload gagal');
      const data = await res.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      alert('Gagal mengupload gambar ke server!');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: Number(formData.price),
      stock: Number(formData.stock),
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=500',
    };

    const url = editingProduct
      ? `http://localhost:8080/api/admin/products/${editingProduct.id}`
      : 'http://localhost:8080/api/admin/products';

    const method = editingProduct ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    await fetch(`http://localhost:8080/api/admin/products/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleShip = async (id: number) => {
    const resi = trackingInputs[id];
    if (!resi) return alert('Silakan isi nomor resi ekspedisi!');

    await fetch(`http://localhost:8080/api/admin/orders/${id}/ship`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: resi }),
    });

    alert('Pesanan telah berstatus dikirim!');
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              ⚙️ Panel Pengelola Toko
            </h1>
            <p className="text-xs text-slate-500">Kelola stok barang alat tulis & monitor pesanan siap kirim.</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft size={16} /> Ke Toko Pembeli
          </Link>
        </div>

        {/* Notifikasi Backend Status */}
        {!isBackendConnected && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3.5 rounded-2xl text-xs flex items-center gap-2">
            ⚠️ <strong>Menghubungkan ke Backend di Port 8080...</strong> Pastikan Spring Boot di VS Code sudah dalam kondisi <code>Run</code>.
          </div>
        )}

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pink-50 border border-pink-200 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-pink-600 uppercase">Total Produk</span>
            <div className="text-2xl font-black text-pink-800 mt-1">{summary.totalProducts} Item</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Siap Dikirim (Lunas)</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{summary.readyToShipOrders} Pesanan</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Menunggu QRIS</span>
            <div className="text-2xl font-black text-amber-800 mt-1">{summary.pendingOrders} Pesanan</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Terkirim</span>
            <div className="text-2xl font-black text-blue-800 mt-1">{summary.shippedOrders} Pesanan</div>
          </div>
        </div>

        {/* Navigasi Tab */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'products'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border'
            }`}
          >
            <ShoppingBag size={16} /> Kelola Produk & Stok ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'orders'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border'
            }`}
          >
            <Truck size={16} /> Pesanan Siap Kirim ({orders.length})
          </button>
        </div>

        {/* TAB 1: MANAJEMEN PRODUK */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Daftar Katalog Produk</h3>
                <p className="text-xs text-slate-400">Tambah barang baru dengan foto atau perbarui stok.</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
              >
                <Plus size={16} /> Tambah Produk Baru
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b">
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
                          src={p.imageUrl}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1588072432836-e10032774350?w=500';
                          }}
                          className="w-12 h-12 object-cover rounded-xl border"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                          <div className="text-slate-400 text-[11px] line-clamp-1 max-w-xs">{p.description}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            p.stock > 10
                              ? 'bg-emerald-100 text-emerald-700'
                              : p.stock > 0
                              ? 'bg-amber-100 text-amber-700'
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
                            onClick={() => handleDeleteProduct(p.id)}
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

        {/* TAB 2: PESANAN SIAP KIRIM */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-100/80 font-bold text-xs uppercase tracking-wider text-slate-600 border-b">
              Antrean Paket yang Harus Dipacking & Dikirim
            </div>

            {orders.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                Tidak ada pesanan yang menunggu pengiriman saat ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <div key={o.id} className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 space-y-1">
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        LUNAS (QRIS)
                      </span>
                      <h3 className="font-bold text-slate-800 text-base">{o.recipientName}</h3>
                      <p className="text-xs text-slate-500 font-mono">📱 {o.phoneNumber}</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border mt-2">
                        📍 {o.shippingAddress}, {o.city} ({o.postalCode})
                      </p>
                    </div>

                    <div className="md:w-1/3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Barang:</span>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {o.items?.map((it, idx) => (
                          <li key={idx} className="flex justify-between border-b border-dashed pb-1">
                            <span>{it.quantity}x {it.productName}</span>
                            <span className="font-medium">Rp {it.subtotal.toLocaleString('id-ID')}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 text-right font-black text-sm text-pink-600">
                        Total: Rp {o.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="md:w-1/3 bg-slate-50 p-4 rounded-xl border flex flex-col justify-between">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Nomor Resi Ekspedisi
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: JNE12345678"
                          className="w-full p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                          value={trackingInputs[o.id] || ''}
                          onChange={(e) =>
                            setTrackingInputs({ ...trackingInputs, [o.id]: e.target.value })
                          }
                        />
                      </div>
                      <button
                        onClick={() => handleShip(o.id)}
                        className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
                      >
                        Konfirmasi Kirim 🚚
                      </button>
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
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-pink-100 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {editingProduct ? '✏️ Edit Produk' : '✨ Tambah Produk Baru'}
              </h2>
              <p className="text-xs text-slate-400 mb-4">Lengkapi rincian alat tulis atau aksesori sekolah.</p>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Nama Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kotak Pensil Unicorn 3D"
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Kategori</label>
                  <select
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Alat Tulis">Alat Tulis</option>
                    <option value="Aksesori">Aksesori</option>
                    <option value="Tas & Kotak Pensil">Tas & Kotak Pensil</option>
                    <option value="Buku & Kertas">Buku & Kertas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="35000"
                      className="w-full mt-1 p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-400"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Jumlah Stok</label>
                    <input
                      type="number"
                      required
                      placeholder="50"
                      className="w-full mt-1 p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-400"
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
                          imageUploadMode === 'file' ? 'bg-white shadow text-pink-600' : 'text-slate-500'
                        }`}
                      >
                        <Upload size={12} /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                          imageUploadMode === 'url' ? 'bg-white shadow text-pink-600' : 'text-slate-500'
                        }`}
                      >
                        <LinkIcon size={12} /> Link URL
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === 'file' ? (
                    <div className="border-2 border-dashed border-pink-200 rounded-2xl p-4 text-center hover:bg-pink-50/50 transition relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-1">
                        <Upload className="mx-auto text-pink-500" size={24} />
                        <div className="text-xs font-bold text-slate-700">
                          {uploadingImage ? 'Mengupload ke Server...' : 'Klik untuk Pilih Foto dari Laptop'}
                        </div>
                        <p className="text-[10px] text-slate-400">Mendukung file PNG, JPG, JPEG</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-400"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  )}

                  {/* Pratinjau Foto */}
                  {formData.imageUrl && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg border"
                      />
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          ✓ Foto Siap Digunakan
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[240px]">{formData.imageUrl}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Bahan tebal, warna tahan luntur..."
                    className="w-full mt-1 p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-400"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

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
                    disabled={uploadingImage}
                    className="w-1/2 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200"
                  >
                    {uploadingImage ? 'Mengupload...' : 'Simpan Produk 💾'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}