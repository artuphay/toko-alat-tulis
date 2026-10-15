'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';
import KimaLogo from './KimaLogo';
import { apiFetch, ApiError } from '../lib/api';

export default function AdminLogin({ notice, onLogin }: { notice?: string; onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { token } = await apiFetch<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      onLogin(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal masuk.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kima-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border-4 border-kima-lavender/40 shadow-xl p-8 w-full max-w-sm space-y-5">
        <div className="flex justify-center">
          <KimaLogo showTagline={false} />
        </div>
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-kima-ink">Panel Pengelola Toko</h1>
          <p className="text-xs text-slate-500 mt-1">Masukkan password admin untuk melanjutkan.</p>
        </div>

        {notice && <p className="text-xs bg-kima-yellow/30 text-kima-ink p-3 rounded-xl">{notice}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="Password admin"
              className="w-full pl-9 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-kima-pink"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 p-2.5 rounded-xl">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-kima-pink-deep hover:brightness-95 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-kima-pink/40"
          >
            {submitting ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>

        <Link href="/" className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-kima-pink-deep">
          <ArrowLeft size={14} /> Kembali ke toko
        </Link>
      </div>
    </div>
  );
}
