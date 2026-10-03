import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import { ShieldCheck, Leaf, Sparkles, Heart, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: ShieldCheck, title: "NABL Certified",    desc: "Lab-tested for complete safety & quality assurance." },
  { icon: Leaf,        title: "100% Organic Cotton", desc: "Breathable, chemical-free, gentle on sensitive skin." },
  { icon: Sparkles,    title: "Rash-Free Comfort",   desc: "Clinically proven to prevent irritation & rashes." },
  { icon: Heart,       title: "Gynecologist Approved", desc: "Trusted by leading women's health experts." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbff] font-sans">
      <Header />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-28">
        {/* Background blobs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-200/25 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-200/25 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#d6008a] animate-pulse" />
              <span className="text-[10.5px] font-bold text-[#d6008a] tracking-widest uppercase">
                India's First 10-in-1 Uterus Protection
              </span>
            </div>

            <h1 className="text-[48px] lg:text-[56px] font-black text-[#1e1a3a] leading-[1.08] tracking-tight mb-5">
              Safe. Organic.{" "}
              <span className="bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a] bg-clip-text text-transparent">
                Period Care
              </span>{" "}
              You Deserve.
            </h1>

            <p className="text-[16px] text-slate-500 leading-relaxed mb-8 max-w-[480px]">
              Crafted with breathable hot-air cotton and soothing aloe vera — because your body deserves the purest care, every single day.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-[15px] font-bold no-underline
                bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]
                shadow-[0_6px_24px_rgba(214,0,138,0.30)]
                hover:opacity-90 hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(214,0,138,0.40)]
                transition-all duration-200"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[#1e3a5f] text-[14px] font-semibold border border-slate-200 no-underline bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-8">
              <div className="flex -space-x-2">
                {["A", "M", "P"].map((l, i) => (
                  <div key={l} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b2a8a] to-[#d6008a] flex items-center justify-center text-white text-[11px] font-bold border-2 border-white">
                    {l}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[12px]">
                <Star size={13} fill="#fbbf24" color="#fbbf24" />
                <span className="font-bold text-[#1e1a3a]">4.9</span>
                <span className="text-slate-400">· 25 Lakh+ Happy Women</span>
              </div>
            </div>
          </div>

          {/* Right — product image */}
          <div className="hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden border-[3px] border-white shadow-[0_24px_60px_rgba(59,42,138,0.15)]">
              <img
                src="/product.webp"
                alt="Care N Safe Organic Sanitary Pads"
                className="w-full h-[420px] object-cover block"
              />
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-md text-[12px] font-bold text-[#1e1a3a]">
                  <ShieldCheck size={14} className="text-[#d6008a]" />
                  Gynecologist Approved · NABL Certified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-extrabold text-[#1e1a3a] tracking-tight mb-2">
              Why Women Trust{" "}
              <span className="bg-gradient-to-r from-[#3b2a8a] to-[#d6008a] bg-clip-text text-transparent">
                Care N Safe
              </span>
            </h2>
            <p className="text-[14px] text-slate-400">India's most loved organic period care brand</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-[#fdfbff] border border-violet-100 rounded-2xl p-6 text-center hover:shadow-[0_8px_30px_rgba(59,42,138,0.10)] hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#3b2a8a] group-hover:to-[#d6008a] transition-colors duration-200">
                  <Icon size={22} className="text-[#d6008a] group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-[14px] font-bold text-[#1e1a3a] mb-1.5">{title}</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-[#1e1a3a] mb-3">
            Ready to Make the Switch?
          </h2>
          <p className="text-[14px] text-slate-400 mb-8">
            Join 25 lakh+ women who chose organic, rash-free period care.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-[15px] font-bold no-underline
              bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]
              shadow-[0_6px_24px_rgba(214,0,138,0.30)]
              hover:opacity-90 hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(214,0,138,0.40)]
              transition-all duration-200"
            >
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[#1e3a5f] text-[14px] font-semibold border border-slate-200 no-underline bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Already a Member? Log In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
