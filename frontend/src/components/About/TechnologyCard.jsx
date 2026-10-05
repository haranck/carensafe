// One technology: illustration tile + title, points and a highlighted benefit. `flip` puts the tile on the right
// (desktop), so the list alternates like a magazine layout. Phones always show the tile on top.
const TechnologyCard = ({ index, technology, flip }) => {
  const { title, icon: Icon, image, points, benefit, tile } = technology;
  const number = String(index + 1).padStart(2, "0");

  return (
    <article className="grid overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_30px_-18px_rgba(59,42,138,0.35)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(214,0,138,0.35)] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className={`relative flex min-h-[180px] items-center justify-center overflow-hidden sm:min-h-[220px] ${tile.bg} ${flip ? "sm:order-2" : ""}`}>
        <span aria-hidden="true" className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/25" />
        <span aria-hidden="true" className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-white/15" />
        <span aria-hidden="true" className="absolute left-4 top-4 z-10 rounded-full bg-white/80 px-2.5 py-0.5 text-[11.5px] font-extrabold tracking-widest text-slate-700">
          {number}
        </span>
        {image ? (
          <img src={image} alt={title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
        ) : (
          <span className={`relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/30 ring-8 backdrop-blur-sm ${tile.ring}`}>
            <Icon size={46} strokeWidth={1.6} aria-hidden="true" className={tile.icon} />
          </span>
        )}
      </div>

      <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
        <h3 className="text-[17px] font-extrabold leading-snug text-[#1e1a3a] sm:text-[19px]">
          <span className="text-[#d6008a]">{index + 1}.</span> {title}
        </h3>
        <ul className="flex flex-col gap-1.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-slate-600">
              <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#d6008a]" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-1 rounded-xl border-l-4 border-[#d6008a] bg-[#fff5fa] px-4 py-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#d6008a]">Benefit</p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-[#1e1a3a]">{benefit}</p>
        </div>
      </div>
    </article>
  );
};

export default TechnologyCard;
