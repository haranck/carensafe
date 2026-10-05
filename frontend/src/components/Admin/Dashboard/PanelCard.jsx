import { ADMIN_CARD } from "../Orders/adminOrderStyles";

// Admin card with a title row (optional subtitle and action on the right)
const PanelCard = ({ title, subtitle, action, className = "", bodyClassName = "p-5", children }) => (
  <section className={`${ADMIN_CARD} flex flex-col ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className={`flex-1 ${bodyClassName}`}>{children}</div>
  </section>
);

export default PanelCard;
