export const KIMA_CATEGORIES = [
  'Aksesori Rambut',
  'Gelang & Kalung',
  'Gantungan Kunci',
  'Tas & Dompet',
];

// Warna chip per kategori, diambil dari palet Kima.
const CATEGORY_STYLES: Record<string, string> = {
  'Aksesori Rambut': 'bg-kima-pink/25 text-kima-pink-deep',
  'Gelang & Kalung': 'bg-kima-lavender/30 text-kima-lavender-deep',
  'Gantungan Kunci': 'bg-kima-blue/25 text-kima-blue-deep',
  'Tas & Dompet': 'bg-kima-mint/30 text-kima-mint-deep',
};

export function categoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? 'bg-kima-yellow/40 text-kima-yellow-deep';
}
