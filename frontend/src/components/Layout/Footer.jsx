import { Link, useLocation } from "react-router-dom";
import { showsBottomNav } from "./HeaderParts/navConfig";
import { ShieldCheck } from "lucide-react";

export const Footer = () => {
  const { pathname } = useLocation();
  return (
    <footer className="bg-[#2c265a] text-slate-300 py-10 px-4 sm:px-6 lg:px-8 font-sans border-t border-slate-700/50">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Care N Safe" className="h-9 object-contain brightness-0 invert opacity-90" />
            <div>
              <h3 className="text-white font-bold text-base leading-tight">Care N Safe</h3>
              <p className="text-[#d6008a] text-[9px] font-bold uppercase tracking-wider">Pure Organic Wellness</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
            Empowering women with hygienic, 100% organic, rash-free period care solutions.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {["IG", "FB", "X"].map(s => (
              <a key={s} href="#" className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d6008a] hover:text-white transition-all text-slate-300 text-[9px] font-bold">
                {s}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10">
              <ShieldCheck size={10} className="text-[#d6008a]" /> NABL
            </span>
            <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10">
              MADE IN INDIA
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-3 text-xs tracking-wide">Quick Links</h4>
          <ul className="space-y-2 text-[11px]">
            {["Shop All Products", "About Us", "Technology & Care", "Educational Videos", "Contact Us"].map(l => (
              <li key={l}><Link to="#" className="hover:text-white transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 className="text-white font-bold mb-3 text-xs tracking-wide">Policies & Support</h4>
          <ul className="space-y-2 text-[11px]">
            {["Shipping & Delivery", "Refund & Cancellation", "Terms & Conditions", "Privacy Policy", "Customer Support"].map(l => (
              <li key={l}><Link to="#" className="hover:text-white transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* Corporate Office */}
        <div>
          <h4 className="text-white font-bold mb-3 text-xs tracking-wide">Corporate Office</h4>
          <div className="space-y-2 text-[11px] text-slate-400">
            <p className="text-white font-semibold text-[11px]">UNISAFE ENTERPRISES</p>
            <p>📍 SIDCO Industrial Estate, Ambattur, Chennai, TN 600058</p>
            <p>📞 1800-CARE-SAFE (Toll-Free)</p>
            <p>✉️ care@caren-safe.com</p>
            <p className="text-white/40 italic text-[10px]">Mon - Sat: 9 AM - 7 PM IST</p>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1600px] mx-auto mt-8 pt-5 border-t border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
        <p>© 2026 Care N Safe. All Rights Reserved.</p>
        <div className="flex gap-1.5">
          {["UPI", "RuPay", "Visa", "Mastercard", "NetBanking"].map(method => (
            <span key={method} className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-slate-400">
              {method}
            </span>
          ))}
        </div>
      </div>
      {/* Room for the phone bottom tab bar, so the end of the footer isn't hidden behind it */}
      {showsBottomNav(pathname) && <div aria-hidden="true" className="h-20 lg:hidden" />}
    </footer>
  );
};

export default Footer;
