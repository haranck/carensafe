import { Droplets, Feather, Leaf, ShieldCheck, Star } from "lucide-react";

// Half-body cut-out (transparent WebP cropped from public/girl1.png): 1080px for the panel, 560px for phones
const GIRL_SRC_SET = "/auth/girl-half-body-560.webp 560w, /auth/girl-half-body-1080.webp 1080w";
const GIRL_ALT = "Smiling young woman pointing at a pack of Care N Safe sanitary napkins";

const CONTENT = {
  login: {
    eyebrow: "Welcome back",
    title: (
      <>
        Welcome <span className="font-accent font-medium italic text-[#d6008a]">back</span>, beautiful{" "}
        <span aria-hidden="true">💗</span>
      </>
    ),
    text: "Your comfort routine is one step away. Log in to reorder your favourites and track your orders.",
  },
  signup: {
    eyebrow: "Join the community",
    title: (
      <>
        Join <span className="font-accent font-medium italic text-[#d6008a]">25 Lakh+</span> women who feel safe every day
      </>
    ),
    text: "Create your account for faster checkout, order tracking and member-only offers.",
  },
};

const BENEFITS = [
  { icon: Droplets, label: "Leak Protection" },
  { icon: Feather, label: "Soft & Comfortable" },
  { icon: Leaf, label: "Skin Friendly" },
];

// Floating petals (pure CSS shapes, decorative)
const PETALS = [
  "left-[6%] top-[58%] h-5 w-4 rotate-12 bg-pink-300/60",
  "right-[8%] top-[12%] h-4 w-3 -rotate-45 bg-fuchsia-300/50",
  "right-[14%] top-[52%] h-6 w-5 rotate-45 bg-pink-200/80",
  "left-[30%] bottom-[6%] h-4 w-3 rotate-90 bg-violet-300/50",
];

const Badge = ({ className, children }) => (
  <span
    className={`absolute z-20 inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-white/90 px-3 py-2 text-[12px] font-bold text-[#1e1a3a] shadow-[0_10px_28px_rgba(59,42,138,0.18)] backdrop-blur-sm ${className}`}
  >
    {children}
  </span>
);

/**
 * Brand panel beside the login / signup form: eyebrow, headline, text and benefit chips on top, the large half-body
 * photo filling the rest down to the bottom edge, with floating badges on its sides. Blush-to-lilac background.
 * `variant`: "login" | "signup". Wide screens (xl+) only; smaller screens get AuthShowcaseCompact above the form.
 */
const AuthShowcase = ({ variant = "login" }) => {
  const { eyebrow, title, text } = CONTENT[variant];

  return (
    <aside className="relative hidden min-h-[700px] flex-col overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-[#ffe4f2] via-[#f8eeff] to-[#e9e0ff] shadow-[0_24px_60px_-28px_rgba(59,42,138,0.45)] xl:flex">
      {/* Soft colour washes + petals */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_380px_at_50%_100%,rgba(214,0,138,0.16),transparent_70%),radial-gradient(380px_260px_at_0%_0%,rgba(124,58,237,0.14),transparent_70%)]"
      />
      {PETALS.map((petal) => (
        <span key={petal} aria-hidden="true" className={`pointer-events-none absolute rounded-[60%_0] ${petal}`} />
      ))}

      <div className="relative z-10 px-10 pt-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d6008a]" />
          {eyebrow}
        </span>
        <h1 className="mt-4 max-w-[560px] text-[36px] font-extrabold leading-[1.1] tracking-tight text-[#1e1a3a] 2xl:text-[40px]">{title}</h1>
        <p className="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-slate-600">{text}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white/75 py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-semibold text-[#3b2a8a] shadow-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
                <Icon size={15} aria-hidden="true" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Photo: fills the rest of the panel down to the bottom edge; badges sit on its sides */}
      <div className="relative z-10 mt-4 min-h-[360px] flex-1">
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-[78%] w-[70%] -translate-x-1/2 rounded-t-full bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.95)_0%,rgba(255,228,242,0.65)_50%,transparent_75%)]"
        />
        <img
          src="/auth/girl-half-body-1080.webp"
          srcSet={GIRL_SRC_SET}
          sizes="560px"
          alt={GIRL_ALT}
          width={1080}
          height={1024}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_18px_30px_rgba(59,42,138,0.22)]"
        />
        <Badge className="left-6 top-[18%]">
          <Star size={14} aria-hidden="true" className="fill-amber-400 text-amber-400" />
          4.9 · 25 Lakh+ happy women
        </Badge>
        <Badge className="bottom-[22%] left-6">
          <Leaf size={14} aria-hidden="true" className="text-emerald-600" />
          100% Organic Cotton
        </Badge>
        <Badge className="bottom-[10%] right-6">
          <ShieldCheck size={14} aria-hidden="true" className="text-[#d6008a]" />
          NABL Certified
        </Badge>
      </div>
    </aside>
  );
};

/** Phones / tablets: the same story in a short strip above the form. */
export const AuthShowcaseCompact = ({ variant = "login", className = "max-w-[460px]" }) => {
  const { title, text } = CONTENT[variant];

  return (
    <div
      className={`relative flex w-full ${className} items-end gap-2 overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-[#ffe4f2] via-[#f8eeff] to-[#e9e0ff] pl-5 pt-5 shadow-[0_16px_40px_-24px_rgba(59,42,138,0.45)] xl:hidden`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(240px_180px_at_100%_100%,rgba(214,0,138,0.16),transparent_70%)]" />
      <div className="relative min-w-0 flex-1 pb-5">
        <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[24px]">{title}</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600 sm:text-[13.5px]">{text}</p>
        <p className="mt-2.5 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] font-bold text-[#1e1a3a]">
          <Star size={12} aria-hidden="true" className="fill-amber-400 text-amber-400" />
          4.9 · 25 Lakh+ women
        </p>
      </div>
      <img
        src="/auth/girl-half-body-560.webp"
        alt=""
        width={560}
        height={531}
        className="relative h-36 w-auto flex-shrink-0 object-contain object-bottom sm:h-48"
      />
    </div>
  );
};

export default AuthShowcase;
