// Original artwork for the hero tray: a sun over two ridges. Loops the develop effect.
export default function Demo() {
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className="demo-loop h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b3a5c" /><stop offset=".55" stopColor="#d9744a" /><stop offset="1" stopColor="#f6c35c" />
        </linearGradient>
        <radialGradient id="sun"><stop offset="0" stopColor="#fff4c9" /><stop offset="1" stopColor="#f6b347" /></radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#sky)" />
      {[[60, 50], [130, 90], [310, 60], [350, 120], [230, 40]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.6" fill="#fff" opacity=".8" />)}
      <circle cx="270" cy="230" r="62" fill="url(#sun)" />
      <path d="M0 300 L70 235 L130 285 L200 215 L290 300 L350 250 L400 290 V400 H0Z" fill="#274a63" />
      <path d="M0 340 L90 290 L170 335 L260 280 L340 330 L400 305 V400 H0Z" fill="#14202b" />
    </svg>
  );
}
