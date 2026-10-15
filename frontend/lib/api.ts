export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const FALLBACK_IMAGE = '/products/placeholder.svg';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Panggil backend dan kembalikan JSON; error backend ({"error": "..."}) dilempar sebagai ApiError.
export async function apiFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Coba lagi sebentar.', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Terjadi kesalahan, silakan coba lagi.', res.status);
  }
  return data as T;
}

export function formatRupiah(amount: number) {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}
