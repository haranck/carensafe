// Numbered white card for a checkout step
const StepCard = ({ number, title, headingId, action, children }) => (
  <section aria-labelledby={headingId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 id={headingId} className="flex items-center gap-2.5 text-[17px] font-extrabold text-[#1e1a3a]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff5fa] text-[13px] font-bold text-[#d6008a]">{number}</span>
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

export default StepCard;
