import { useId } from "react";

// White card used by every profile tab; optional heading, description and an action on the right
const Panel = ({ title, description, action, className = "", children }) => {
  const headingId = useId();

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 id={headingId} className="text-[17px] font-extrabold text-[#1e1a3a]">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
};

export default Panel;
