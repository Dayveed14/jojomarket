// Original, hand-built SVG illustrations of Nigerian dishes (top-down "on the table" view).
// Every scatter is seeded by the dish key, so a dish always draws the same way.
// When Jojo uploads a real photo for a dish, <DishImage> shows the photo instead.
import { useId } from 'react';

function rng(seedStr) {
  let t = [...seedStr].reduce((a, c) => (Math.imul(a ^ c.charCodeAt(0), 2654435761) >>> 0), 1779033703);
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function scatter(r, n, cx, cy, R, fn) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const rad = R * Math.sqrt(r());
    const a = r() * Math.PI * 2;
    out.push(fn(cx + rad * Math.cos(a), cy + rad * Math.sin(a), i));
  }
  return out;
}

// ---------- vessels ----------
function Plate({ p }) {
  return (
    <g>
      <ellipse cx="102" cy="108" rx="90" ry="88" fill="#000" opacity=".16" filter={`url(#${p}blur)`} />
      <circle cx="100" cy="100" r="90" fill={`url(#${p}plate)`} />
      <circle cx="100" cy="100" r="72" fill="#fbf7ee" stroke="#e7dcc6" strokeWidth="1.5" />
      <path d="M38 62 A72 72 0 0 1 92 29" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".8" />
    </g>
  );
}
function Bowl({ p, soup, light }) {
  return (
    <g>
      <ellipse cx="103" cy="109" rx="88" ry="86" fill="#000" opacity=".2" filter={`url(#${p}blur)`} />
      <circle cx="100" cy="100" r="88" fill={`url(#${p}clay)`} />
      <circle cx="100" cy="100" r="76" fill="#3a1a08" opacity=".35" />
      <circle cx="100" cy="100" r="72" fill={soup} />
      <circle cx="100" cy="100" r="72" fill={`url(#${p}soupShade)`} />
      {light && <ellipse cx="80" cy="78" rx="34" ry="18" fill={light} opacity=".35" transform="rotate(-25 80 78)" />}
      <path d="M30 70 A76 76 0 0 1 84 25" stroke="#e9a46a" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".55" />
    </g>
  );
}
function Leaf({ x, y, s = 1, rot = 0, fill = '#3f8f3a', vein = '#2c6a2a' }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-14 0 C-8 -9 8 -9 14 0 C8 9 -8 9 -14 0Z" fill={fill} />
      <path d="M-12 0 L12 0" stroke={vein} strokeWidth="1" opacity=".7" />
    </g>
  );
}
function BananaLeaf() {
  return (
    <g>
      <path d="M8 120 C30 40 120 10 196 46 C178 130 92 196 8 120Z" fill="#2f7d32" />
      <path d="M8 120 C70 100 140 70 196 46" stroke="#a5d17a" strokeWidth="2" fill="none" />
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => (
        <path key={t} d={`M${8 + 188 * t} ${120 - 74 * t} l ${-18 + t * 10} ${-40 + t * 8}`} stroke="#5aa547" strokeWidth="1.2" opacity=".7" />
      ))}
      {[0.2, 0.35, 0.5, 0.65].map((t) => (
        <path key={`b${t}`} d={`M${8 + 188 * t} ${120 - 74 * t} l ${10 + t * 6} ${40 - t * 14}`} stroke="#5aa547" strokeWidth="1.2" opacity=".6" />
      ))}
    </g>
  );
}

// ---------- foods ----------
function Grains({ r, n, cx, cy, R, colors, size = 1 }) {
  return scatter(r, n, cx, cy, R, (x, y, i) => (
    <ellipse key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} rx={(3.6 * size).toFixed(1)} ry={(1.5 * size).toFixed(1)} fill={pick(r, colors)}
      transform={`rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})`} />
  ));
}
function Mound({ p, cx, cy, R, base, colors, r, n = 230 }) {
  return (
    <g>
      <circle cx={cx} cy={cy + 3} r={R} fill="#000" opacity=".12" />
      <circle cx={cx} cy={cy} r={R} fill={base} />
      <Grains r={r} n={n} cx={cx} cy={cy} R={R - 3} colors={colors} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#${p}dome)`} />
    </g>
  );
}
function Drumstick({ x, y, rot = 0, s = 1, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x="18" y="-4" width="20" height="8" rx="4" fill="#f4ead8" />
      <circle cx="38" cy="-4" r="5" fill="#f4ead8" /><circle cx="38" cy="4" r="5" fill="#f4ead8" />
      <path d="M-28 0 C-28 -20 6 -22 22 -6 C26 0 26 0 22 6 C6 22 -28 20 -28 0Z" fill={`url(#${p}fried)`} />
      <path d="M-20 -8 C-12 -14 0 -14 8 -9" stroke="#f2a35a" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".7" />
      {[[-14, 4], [-4, -6], [6, 6], [-18, -4], [2, 10]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="1.6" fill={i % 2 ? '#8b1d0e' : '#e2442a'} />)}
    </g>
  );
}
function ChickenPiece({ x, y, rot = 0, s = 1, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-22 -4 C-20 -20 14 -22 22 -8 C28 4 18 20 0 20 C-18 20 -24 8 -22 -4Z" fill={`url(#${p}fried)`} />
      <path d="M-14 -10 C-6 -16 6 -16 12 -10" stroke="#f6b26b" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".75" />
      {[[-10, 4], [0, -4], [10, 6], [-4, 12], [12, -2]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="1.7" fill={i % 2 ? '#7d1a0c' : '#e8452b'} />)}
    </g>
  );
}
function Dodo({ x, y, rot = 0, s = 1, p }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse rx="14" ry="8" fill={`url(#${p}dodo)`} stroke="#9a4410" strokeWidth="1.6" />
      <ellipse cx="-3" cy="-2" rx="6" ry="2.4" fill="#ffe08a" opacity=".7" />
    </g>
  );
}
function OnionRing({ x, y, s = 1 }) {
  return <ellipse cx={x} cy={y} rx={7 * s} ry={5 * s} fill="none" stroke="#f1e2f0" strokeWidth={2.2 * s} opacity=".95" />;
}
function MeatChunks({ r, n, cx, cy, R, colors = ['#6e3216', '#5a2810', '#82401e'], fat = '#e8cfae' }) {
  return scatter(r, n, cx, cy, R, (x, y, i) => {
    const w = 9 + r() * 7; const h = 7 + r() * 5;
    return (
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.round(r() * 90)})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="3.5" fill={pick(r, colors)} />
        {i % 3 === 0 && <rect x={-w / 2} y={-h / 2} width={w} height="2.6" rx="1.3" fill={fat} />}
        <rect x={-w / 2 + 2} y={-h / 2 + 1} width={w / 2} height="1.6" rx=".8" fill="#fff" opacity=".18" />
      </g>
    );
  });
}
function Greens({ r, n, cx, cy, R, colors = ['#2f7a2c', '#3e9a35', '#276b25'] }) {
  return scatter(r, n, cx, cy, R, (x, y, i) => <Leaf key={i} x={x} y={y} s={0.45 + r() * 0.4} rot={r() * 180} fill={pick(r, colors)} vein="#1d4f1c" />);
}
function Dots({ r, n, cx, cy, R, colors, size = [1.2, 2.6], opacity = 1 }) {
  return scatter(r, n, cx, cy, R, (x, y, i) => (
    <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(size[0] + r() * (size[1] - size[0])).toFixed(1)} fill={pick(r, colors)} opacity={opacity} />
  ));
}
function Swallow({ p, x, y, R, from, to }) {
  return (
    <g>
      <ellipse cx={x + 3} cy={y + 6} rx={R} ry={R * 0.92} fill="#000" opacity=".14" />
      <circle cx={x} cy={y} r={R} fill={`url(#${p}sw${from.slice(1)})`} />
      <path d={`M${x - R * 0.6} ${y - R * 0.35} A${R} ${R} 0 0 1 ${x - R * 0.05} ${y - R * 0.8}`} stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".6" />
      <radialGradient id={`${p}sw${from.slice(1)}`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></radialGradient>
    </g>
  );
}
function Craggy({ x, y, R, r, from = '#d9861f', to = '#8a4510', p }) {
  const bumps = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4;
    return <circle key={i} cx={x + Math.cos(a) * R * 0.75} cy={y + Math.sin(a) * R * 0.75} r={R * (0.32 + r() * 0.15)} fill={`url(#${p}akara)`} />;
  });
  return (
    <g>
      <circle cx={x + 2} cy={y + 4} r={R * 1.05} fill="#000" opacity=".12" />
      {bumps}
      <circle cx={x} cy={y} r={R * 0.85} fill={`url(#${p}akara)`} />
      <circle cx={x - R * 0.3} cy={y - R * 0.35} r={R * 0.2} fill="#ffd27a" opacity=".55" />
      <linearGradient id={`${p}akara`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
    </g>
  );
}

function SideSoup({ p, r, x = 138, y = 124, R = 34, soup = '#d98a2b', bits = ['#f2c25a', '#e9a93c', '#f7d47e'] }) {
  return (
    <g>
      <circle cx={x + 3} cy={y + 5} r={R + 2} fill="#000" opacity=".15" />
      <circle cx={x} cy={y} r={R} fill={`url(#${p}clay)`} />
      <circle cx={x} cy={y} r={R - 6} fill={soup} />
      <Dots r={r} n={22} cx={x} cy={y} R={R - 10} colors={bits} size={[1.4, 3]} />
      <Greens r={r} n={5} cx={x} cy={y} R={R - 12} />
      <MeatChunks r={r} n={3} cx={x} cy={y} R={R - 14} />
    </g>
  );
}

const DISHES = {
  jollof: (p, r) => (<>
    <Plate p={p} />
    <Mound p={p} r={r} cx={92} cy={96} R={54} base="#cf4a18" colors={['#e9692a', '#f08a3c', '#c8461a', '#f5a05a', '#de5a22']} />
    <Dots r={r} n={10} cx={92} cy={96} R={44} colors={['#3f8f3a', '#2f7a2c']} size={[1.6, 2.4]} />
    <Drumstick p={p} x={138} y={128} rot={-35} s={1.05} />
    <Dodo p={p} x={56} y={146} rot={-20} /><Dodo p={p} x={78} y={156} rot={-8} /><Dodo p={p} x={46} y={126} rot={-40} />
    <OnionRing x={120} y={72} /><OnionRing x={108} y={62} s={0.8} />
  </>),
  friedrice: (p, r) => (<>
    <Plate p={p} />
    <Mound p={p} r={r} cx={94} cy={96} R={56} base="#e0b54e" colors={['#f2d27a', '#e8c25e', '#f7e09a', '#d9ad45']} />
    <Dots r={r} n={26} cx={94} cy={96} R={50} colors={['#5aa839', '#4d9a31']} size={[2, 2.8]} />
    <Dots r={r} n={18} cx={94} cy={96} R={50} colors={['#ff8a2a', '#f26b12']} size={[1.8, 2.6]} />
    <Dots r={r} n={14} cx={94} cy={96} R={50} colors={['#ffd84a']} size={[1.6, 2.2]} />
    <MeatChunks r={r} n={5} cx={94} cy={96} R={40} colors={['#5a2a18', '#4a2212']} fat="#5a2a18" />
    <ChickenPiece p={p} x={140} y={132} rot={20} s={1} />
  </>),
  ofada: (p, r) => (<>
    <Plate p={p} />
    <g transform="translate(16 20) scale(.84)"><BananaLeaf /></g>
    <Mound p={p} r={r} cx={74} cy={104} R={40} base="#a8784e" colors={['#c79f78', '#b88a5f', '#d8b58f', '#946540']} n={150} />
    <path d="M110 70 C140 58 162 82 156 110 C150 140 120 146 104 128 C92 112 96 78 110 70Z" fill="#46601d" />
    <Dots r={r} n={22} cx={130} cy={102} R={26} colors={['#8fa63a', '#a8b84a', '#e0b12a']} size={[1.4, 3]} opacity={0.85} />
    <MeatChunks r={r} n={5} cx={130} cy={104} R={18} colors={['#4f2210', '#62301a']} fat="#d9b88e" />
    <g transform="translate(122 140)"><ellipse rx="13" ry="10" fill="#fffdf6" stroke="#eadfca" /><circle cx="1" cy="0" r="5.5" fill="#f6b21b" /></g>
  </>),
  egusi: (p, r) => (<>
    <Bowl p={p} soup="#d98a2b" light="#ffd27a" />
    <Dots r={r} n={70} cx={100} cy={100} R={64} colors={['#f2c25a', '#e9a93c', '#f7d47e', '#d38a24']} size={[2, 4.2]} />
    <Greens r={r} n={14} cx={100} cy={100} R={56} />
    <MeatChunks r={r} n={7} cx={100} cy={100} R={50} />
    <Dots r={r} n={8} cx={100} cy={100} R={60} colors={['#f0561a']} size={[2.5, 5]} opacity={0.55} />
  </>),
  eforiro: (p, r) => (<>
    <Bowl p={p} soup="#2f531a" light="#6aa33a" />
    <Greens r={r} n={34} cx={100} cy={100} R={62} colors={['#2f6b22', '#3c7f2a', '#24561a', '#4a8f32']} />
    <Dots r={r} n={20} cx={100} cy={100} R={62} colors={['#d9411a', '#e95a1e']} size={[1.6, 3.6]} opacity={0.85} />
    <MeatChunks r={r} n={7} cx={100} cy={100} R={50} />
  </>),
  ogbono: (p, r) => (<>
    <Bowl p={p} soup="#6f5a26" light="#b39a4a" />
    {scatter(r, 9, 100, 100, 46, (x, y, i) => <path key={i} d={`M${x - 18} ${y} q 9 -8 18 0 t 18 0`} stroke="#9a8238" strokeWidth="3" fill="none" opacity=".7" />)}
    {scatter(r, 9, 100, 100, 56, (x, y, i) => (
      <g key={`o${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
        <circle r="6.5" fill="#7fb03a" stroke="#5b8a26" strokeWidth="1.2" />
        {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={3 * Math.cos(a * Math.PI / 180)} cy={3 * Math.sin(a * Math.PI / 180)} r="1" fill="#f2f6dd" />)}
      </g>
    ))}
    <Greens r={r} n={8} cx={100} cy={100} R={56} />
    <MeatChunks r={r} n={6} cx={100} cy={100} R={48} />
  </>),
  banga: (p, r) => (<>
    <Bowl p={p} soup="#8a2e10" light="#e06a2a" />
    {scatter(r, 4, 100, 100, 34, (x, y, i) => (
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.round(r() * 180)})`}>
        <ellipse rx="17" ry="10" fill="#9a8571" /><ellipse rx="17" ry="10" fill="none" stroke="#4d3a2c" strokeWidth="2.5" />
        <ellipse cx="-3" cy="-3" rx="8" ry="3" fill="#d9c8b4" opacity=".55" />
      </g>
    ))}
    <Greens r={r} n={7} cx={100} cy={100} R={58} />
    <Dots r={r} n={10} cx={100} cy={100} R={62} colors={['#f07a2a']} size={[2, 4]} opacity={0.5} />
  </>),
  peppersoup: (p, r) => (<>
    <Bowl p={p} soup="#b2481a" light="#f0a05a" />
    <circle cx="100" cy="100" r="50" fill="#d0712f" opacity=".35" />
    <MeatChunks r={r} n={9} cx={100} cy={100} R={50} colors={['#6b3a22', '#7c4428', '#5a2e1a']} />
    <Greens r={r} n={9} cx={100} cy={100} R={56} colors={['#2f7a2c', '#4a9a3a']} />
    <Dots r={r} n={12} cx={100} cy={100} R={60} colors={['#e0311a', '#ff6a2a']} size={[1.4, 2.4]} />
  </>),
  fishstew: (p, r) => (<>
    <Bowl p={p} soup="#bd2e17" light="#ff7a3a" />
    {scatter(r, 4, 100, 100, 32, (x, y, i) => (
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.round(r() * 180)})`}>
        <path d="M-20 0 C-14 -12 14 -12 20 0 C14 12 -14 12 -20 0Z" fill="#c9893a" />
        <path d="M-14 -4 C-6 -9 6 -9 12 -4" stroke="#f2c06a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M20 0 l8 -7 v14z" fill="#a8692a" />
      </g>
    ))}
    <OnionRing x={70} y={80} /><OnionRing x={132} y={124} /><OnionRing x={124} y={70} s={0.8} />
    <Dots r={r} n={14} cx={100} cy={100} R={60} colors={['#ff5a2a', '#e8401a']} size={[2, 3.4]} opacity={0.7} />
  </>),
  poundo: (p, r) => (<>
    <Plate p={p} />
    <Swallow p={p} x={70} y={80} R={32} from="#ffffff" to="#e2d9bf" />
    <Swallow p={p} x={70} y={138} R={26} from="#fffdf6" to="#ddd2b4" />
    <SideSoup p={p} r={r} x={134} y={104} R={40} soup={'#d98a2b'} bits={['#f2c25a', '#e9a93c', '#f7d47e']} />
    <Leaf x={112} y={160} rot={-20} s={0.9} />
  </>),
  amala: (p, r) => (<>
    <Plate p={p} />
    <Swallow p={p} x={70} y={80} R={32} from="#8a7262" to="#3f3027" />
    <Swallow p={p} x={70} y={138} R={26} from="#7f6858" to="#3a2c23" />
    <SideSoup p={p} r={r} x={134} y={104} R={40} soup={'#3d6b1f'} bits={['#5aa547', '#2f7a2c', '#e2b93a']} />
    <Leaf x={112} y={160} rot={-20} s={0.9} />
  </>),
  eba: (p, r) => (<>
    <Plate p={p} />
    <Swallow p={p} x={70} y={80} R={32} from="#ffe9a8" to="#e3ad3a" />
    <Swallow p={p} x={70} y={138} R={26} from="#ffe39a" to="#dca434" />
    <SideSoup p={p} r={r} x={134} y={104} R={40} soup={'#6f5a26'} bits={['#7fb03a', '#9a8238']} />
    <Leaf x={112} y={160} rot={-20} s={0.9} />
  </>),
  moimoi: (p, r) => (<>
    <Plate p={p} />
    <g transform="translate(26 32) scale(.74)"><BananaLeaf /></g>
    {[[82, 92, -12], [124, 116, 14]].map(([x, y, rot], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
        <rect x="-30" y="-22" width="60" height="44" rx="18" fill="#000" opacity=".12" transform="translate(2 4)" />
        <rect x="-30" y="-22" width="60" height="44" rx="18" fill={`url(#${p}moi)`} />
        <Dots r={r} n={14} cx={0} cy={0} R={18} colors={['#b8401c', '#f39a6a']} size={[0.8, 1.8]} />
        <g transform="translate(6 -2)"><ellipse rx="10" ry="7" fill="#fffaf0" /><circle r="4" fill="#f6b21b" /></g>
      </g>
    ))}
  </>),
  dodo: (p, r) => (<>
    <Plate p={p} />
    {Array.from({ length: 13 }, (_, i) => {
      const a = (i / 13) * Math.PI * 2; const R = i % 2 ? 44 : 26;
      return <Dodo key={i} p={p} x={100 + Math.cos(a) * R} y={100 + Math.sin(a) * R} rot={(a * 180) / Math.PI + 70 + r() * 20} s={1.1} />;
    })}
    <Dodo p={p} x={100} y={100} rot={30} s={1.15} />
  </>),
  chicken: (p) => (<>
    <Plate p={p} />
    <circle cx="100" cy="100" r="56" fill="#c0391a" opacity=".22" />
    <ChickenPiece p={p} x={78} y={78} rot={-20} s={1.1} /><ChickenPiece p={p} x={126} y={82} rot={30} s={1} />
    <Drumstick p={p} x={96} y={126} rot={10} s={1} /><ChickenPiece p={p} x={60} y={124} rot={70} s={0.85} />
    <OnionRing x={120} y={118} /><OnionRing x={140} y={130} s={0.8} /><OnionRing x={92} y={60} s={0.8} />
    {[[110, 98], [72, 102], [136, 104], [86, 148]].map(([x, y], i) => <rect key={i} x={x} y={y} width="7" height="3" rx="1.5" fill={i % 2 ? '#2f8a2f' : '#e0311a'} transform={`rotate(${i * 40} ${x} ${y})`} />)}
  </>),
  asun: (p, r) => (<>
    <Plate p={p} />
    <MeatChunks r={r} n={30} cx={100} cy={100} R={54} colors={['#5a2410', '#7a3416', '#8f4320', '#4a1c0a']} fat="#c98a5a" />
    <Dots r={r} n={26} cx={100} cy={100} R={56} colors={['#e0311a', '#ff5a1a']} size={[1.4, 2.8]} />
    {scatter(r, 9, 100, 100, 50, (x, y, i) => <path key={`on${i}`} d={`M${x} ${y} q 6 -5 12 0`} stroke="#ead3ea" strokeWidth="2.4" fill="none" strokeLinecap="round" />)}
    {scatter(r, 6, 100, 100, 50, (x, y, i) => <rect key={`g${i}`} x={x} y={y} width="8" height="3" rx="1.5" fill="#3a9a3a" transform={`rotate(${i * 50} ${x} ${y})`} />)}
  </>),
  smallchops: (p, r) => (<>
    <rect x="18" y="22" width="168" height="168" rx="14" fill="#000" opacity=".16" filter={`url(#${p}blur)`} />
    <rect x="14" y="14" width="172" height="172" rx="14" fill="#c99a5e" />
    <rect x="24" y="24" width="152" height="152" rx="8" fill="#f6ead2" />
    <path d="M24 60 L176 40 M24 120 L176 100" stroke="#e8d7b6" strokeWidth="1" />
    {[[52, 54], [76, 46], [62, 76], [88, 70], [44, 96]].map(([x, y], i) => (
      <g key={`pp${i}`}><circle cx={x} cy={y} r="13" fill={`url(#${p}akara)`} /><Dots r={r} n={6} cx={x} cy={y} R={9} colors={['#fff8e8']} size={[0.7, 1.1]} /></g>
    ))}
    {[[132, 54, 20], [140, 78, 14], [128, 100, 24]].map(([x, y, rot], i) => (
      <g key={`sr${i}`} transform={`translate(${x} ${y}) rotate(${rot})`}><rect x="-24" y="-7" width="48" height="14" rx="7" fill="#e3a24a" /><path d="M-14 -7 v14 M0 -7 v14 M14 -7 v14" stroke="#c07a2a" strokeWidth="1.2" /></g>
    ))}
    {[[60, 136, 0], [90, 148, 30], [48, 160, -20]].map(([x, y, rot], i) => (
      <path key={`sm${i}`} d="M-14 10 L0 -14 L14 10Z" fill="#e6aa4f" stroke="#b9792c" strokeWidth="1.4" strokeLinejoin="round" transform={`translate(${x} ${y}) rotate(${rot})`} />
    ))}
    <g transform="translate(140 140) rotate(-35)">
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#d7b98a" strokeWidth="2" />
      {[-18, -4, 10].map((x) => <rect key={x} x={x - 6} y="-7" width="12" height="14" rx="5" fill="#6b2a12" />)}
      <circle cx="-11" cy="-2" r="1.6" fill="#e0311a" /><circle cx="4" cy="2" r="1.6" fill="#e0311a" />
    </g>
  </>),
  akara: (p, r) => (<>
    <Plate p={p} />
    {[[76, 76], [118, 70], [146, 106], [60, 116], [102, 108], [124, 142], [82, 148]].map(([x, y], i) => <Craggy key={i} p={`${p}${i}`} x={x} y={y} R={17} r={r} />)}
  </>),
  chinchin: (p, r) => (<>
    <ellipse cx="103" cy="109" rx="88" ry="86" fill="#000" opacity=".16" filter={`url(#${p}blur)`} />
    <circle cx="100" cy="100" r="88" fill="#f4f1ea" /><circle cx="100" cy="100" r="88" fill="none" stroke="#2a5d9a" strokeWidth="5" strokeDasharray="4 8" />
    <circle cx="100" cy="100" r="74" fill="#efe6d2" />
    {scatter(r, 120, 100, 100, 66, (x, y, i) => (
      <rect key={i} x={x - 4} y={y - 3.5} width="8" height="7" rx="2" fill={pick(r, ['#e9a542', '#d98d2c', '#f2bd5c', '#c87a22'])} transform={`rotate(${Math.round(r() * 90)} ${x.toFixed(1)} ${y.toFixed(1)})`} />
    ))}
  </>),
  partypack: (p, r) => (<>
    <rect x="16" y="30" width="176" height="150" rx="12" fill="#000" opacity=".16" filter={`url(#${p}blur)`} />
    <rect x="12" y="24" width="176" height="150" rx="12" fill="#ffffff" stroke="#e3dccb" strokeWidth="2" />
    <rect x="20" y="32" width="100" height="134" rx="8" fill="#fbf6ea" />
    <rect x="126" y="32" width="54" height="64" rx="8" fill="#fbf6ea" /><rect x="126" y="102" width="54" height="64" rx="8" fill="#fbf6ea" />
    <rect x="24" y="36" width="92" height="126" rx="6" fill="#d24f1c" />
    <Grains r={r} n={300} cx={70} cy={99} R={54} colors={['#e9692a', '#f08a3c', '#c8461a', '#f5a05a']} />
    <ChickenPiece p={p} x={88} y={136} rot={-20} s={0.9} />
    <g transform="translate(153 64) rotate(-8)"><rect x="-20" y="-16" width="40" height="32" rx="12" fill={`url(#${p}moi)`} /><ellipse cx="4" rx="7" ry="5" fill="#fffaf0" /><circle cx="4" r="2.8" fill="#f6b21b" /></g>
    {[[142, 122, 20], [162, 132, -10], [148, 150, 30]].map(([x, y, rot], i) => <Dodo key={i} p={p} x={x} y={y} rot={rot} s={0.8} />)}
    {scatter(r, 12, 160, 116, 6, (x, y, i) => <path key={`c${i}`} d={`M${x} ${y} l 8 2`} stroke={i % 2 ? '#d7ecc0' : '#f6f2e0'} strokeWidth="2" strokeLinecap="round" />)}
  </>),
};
DISHES.default = DISHES.jollof;
export const ILLUSTRATIONS = Object.keys(DISHES).filter((k) => k !== 'default');

export function DishArt({ dish = 'jollof', steam = false, className = '', title }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = `d${raw}`;
  const draw = DISHES[dish] || DISHES.default;
  return (
    <svg viewBox="0 0 200 200" className={`dish-art ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <filter id={`${p}blur`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
        <radialGradient id={`${p}plate`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ece2cf" /></radialGradient>
        <radialGradient id={`${p}clay`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#a8562a" /><stop offset=".7" stopColor="#6e3215" /><stop offset="1" stopColor="#4a1f0a" /></radialGradient>
        <radialGradient id={`${p}soupShade`} cx="40%" cy="35%" r="70%"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".32" /></radialGradient>
        <radialGradient id={`${p}dome`} cx="36%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#3a0e00" stopOpacity=".3" /></radialGradient>
        <linearGradient id={`${p}fried`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9692a" /><stop offset=".55" stopColor="#a8401a" /><stop offset="1" stopColor="#6e220c" /></linearGradient>
        <linearGradient id={`${p}dodo`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc84a" /><stop offset=".6" stopColor="#f0941f" /><stop offset="1" stopColor="#b85a12" /></linearGradient>
        <linearGradient id={`${p}moi`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f59a6a" /><stop offset="1" stopColor="#c8502a" /></linearGradient>
        <linearGradient id={`${p}akara`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8a23a" /><stop offset="1" stopColor="#9a5212" /></linearGradient>
      </defs>
      {draw(p, rng(dish))}
      {steam && (
        <g className="dish-art__steam" fill="none" stroke="#fff" strokeWidth="5" opacity=".75" strokeLinecap="round">
          <path d="M80 70 c-8 -10 8 -18 0 -30 c-6 -9 6 -16 2 -24" />
          <path d="M104 64 c-8 -10 8 -18 0 -30 c-6 -9 6 -16 2 -24" />
          <path d="M128 72 c-8 -10 8 -18 0 -30 c-6 -9 6 -16 2 -24" />
        </g>
      )}
    </svg>
  );
}

/** Real photo when Jojo has uploaded one, otherwise the illustration. */
export function DishImage({ meal, steam, className = '' }) {
  if (meal?.imageUrl) return <img src={meal.imageUrl} alt={meal.name} className={`dish-photo ${className}`} loading="lazy" />;
  return <DishArt dish={meal?.illustration || 'jollof'} steam={steam} className={className} title={meal?.name} />;
}

// ---------- loose ingredients for decoration ----------
export function Ingredient({ kind, className = '', style }) {
  const shapes = {
    tomato: (<><circle cx="20" cy="22" r="16" fill="#e2341f" /><circle cx="14" cy="16" r="4" fill="#ff7a5a" opacity=".7" /><path d="M20 6 l3 6 6 -2 -4 5 5 4 -7 0 -3 6 -3 -6 -7 0 5 -4 -4 -5 6 2z" fill="#2f8a2f" /></>),
    pepper: (<><path d="M8 18 C6 8 16 4 20 9 C24 4 34 8 32 18 C32 30 24 36 20 36 C16 36 8 30 8 18Z" fill="#e8281a" /><path d="M20 9 C20 4 22 2 26 2" stroke="#2f8a2f" strokeWidth="3" fill="none" strokeLinecap="round" /><ellipse cx="14" cy="16" rx="3" ry="5" fill="#ff8a6a" opacity=".6" /></>),
    yellowpepper: (<><path d="M8 18 C6 8 16 4 20 9 C24 4 34 8 32 18 C32 30 24 36 20 36 C16 36 8 30 8 18Z" fill="#fdb723" /><path d="M20 9 C20 4 22 2 26 2" stroke="#2f8a2f" strokeWidth="3" fill="none" strokeLinecap="round" /><ellipse cx="14" cy="16" rx="3" ry="5" fill="#fff0b0" opacity=".7" /></>),
    leaf: (<><path d="M4 36 C4 14 18 4 36 4 C36 24 24 36 4 36Z" fill="#3f9a35" /><path d="M4 36 L30 10" stroke="#2a6e24" strokeWidth="1.6" /></>),
    onion: (<><circle cx="20" cy="20" r="15" fill="none" stroke="#c98ac4" strokeWidth="3" /><circle cx="20" cy="20" r="9" fill="none" stroke="#e8c4e4" strokeWidth="2.5" /><circle cx="20" cy="20" r="4" fill="none" stroke="#f3dcf0" strokeWidth="2" /></>),
    plantain: (<><path d="M4 30 C10 10 30 4 38 8 C30 12 18 22 10 34Z" fill="#fdb723" /><path d="M4 30 L10 34" stroke="#6b4a1a" strokeWidth="3" strokeLinecap="round" /></>),
  };
  return <svg viewBox="0 0 40 40" className={`ingredient ${className}`} style={style} aria-hidden="true">{shapes[kind]}</svg>;
}
