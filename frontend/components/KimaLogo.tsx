// Logo Kima: huruf bulat warna-warni, pita di atas huruf, aksen bintang & hati.
const LETTERS = [
  { char: 'K', color: 'text-kima-pink' },
  { char: 'i', color: 'text-kima-yellow' },
  { char: 'm', color: 'text-kima-lavender' },
  { char: 'a', color: 'text-kima-mint' },
];

function Bow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" className={className} aria-hidden="true">
      <path d="M20 12 C12 2, 2 4, 4 12 C2 20, 12 22, 20 12Z" fill="#F78FB8" />
      <path d="M20 12 C28 2, 38 4, 36 12 C38 20, 28 22, 20 12Z" fill="#F78FB8" />
      <path d="M18 13 L13 23 L17 21 L19 24Z M22 13 L27 23 L23 21 L21 24Z" fill="#D94F8A" />
      <circle cx="20" cy="12" r="4" fill="#D94F8A" />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"
        fill="#FFD66E"
        stroke="#F2B93B"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.6 4.5c2.2 0 3.6 1.2 5.4 3.2 1.8-2 3.2-3.2 5.4-3.2 3.6 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z"
        fill="#84C8F5"
      />
    </svg>
  );
}

export default function KimaLogo({
  size = 'md',
  showTagline = true,
}: {
  size?: 'md' | 'lg';
  showTagline?: boolean;
}) {
  const textSize = size === 'lg' ? 'text-6xl' : 'text-3xl';
  const bowSize = size === 'lg' ? 'w-12' : 'w-7';
  const accent = size === 'lg' ? 'w-6' : 'w-3.5';

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex pt-2" aria-label="Kima">
        <Bow className={`absolute -top-1 left-0 -translate-x-1/4 -rotate-12 ${bowSize}`} />
        {LETTERS.map(({ char, color }) => (
          <span
            key={char}
            className={`font-display font-bold leading-none ${textSize} ${color} [text-shadow:0_2px_0_rgba(61,53,81,0.18)]`}
          >
            {char}
          </span>
        ))}
        <Star className={`absolute -top-1 -right-3 ${accent}`} />
        <Heart className={`absolute -bottom-1 -right-4 ${accent}`} />
      </div>
      {showTagline && (
        <div className="ml-4 leading-tight">
          <div className="font-display font-semibold text-kima-ink text-sm">Little Collection</div>
          <div className="text-[10px] text-slate-500">Little Accessories, Big Happiness</div>
        </div>
      )}
    </div>
  );
}
