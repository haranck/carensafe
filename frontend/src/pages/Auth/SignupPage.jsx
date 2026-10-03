import SignupForm from "../../components/Auth/SignupForm";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import { ShieldCheck, Leaf, Sparkles, Star } from "lucide-react";

const FEATURES = [
    { icon: ShieldCheck, label: "NABL Certified Safety" },
    { icon: Leaf, label: "100% Organic Cotton" },
    { icon: Sparkles, label: "Rash-Free Comfort" },
];

const TESTIMONIALS = [
    { name: "Ananya R.", text: "Finally a brand I trust completely!" },
    { name: "Meera S.", text: "Softest pads I've ever used. No more rashes." },
];

const SignupPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#fdfbff] font-sans">
            <Header />

            <main className="flex-1 relative overflow-hidden flex items-center justify-center px-6 py-14">

                {/* ── Blobs ── */}
                <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-violet-200/30 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-pink-200/30 blur-[100px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-center">

                    {/* ════ LEFT: Branding ════ */}
                    <div className="hidden lg:flex flex-col">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-full px-4 py-1.5 mb-6 w-fit">
                            <span className="w-2 h-2 rounded-full bg-[#d6008a] animate-pulse" />
                            <span className="text-[10.5px] font-bold text-[#d6008a] tracking-widest uppercase">
                                100% Organic Cotton · Rash-Free Period Care
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-[42px] font-black text-[#1e1a3a] leading-[1.1] tracking-tight mb-4">
                            Welcome to{" "}
                            <span className="bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a] bg-clip-text text-transparent">
                                Care N Safe
                            </span>
                        </h1>

                        <p className="text-[14.5px] text-slate-500 leading-relaxed mb-7 max-w-[440px]">
                            Experience absolute peace of mind with India's first 10-in-1 uterus
                            protection technology — crafted with breathable hot-air cotton and
                            soothing aloe vera.
                        </p>

                        {/* Feature chips */}
                        <div className="flex flex-wrap gap-2.5 mb-8">
                            {FEATURES.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 bg-white border border-violet-100 rounded-full px-4 py-2 text-[12px] font-semibold text-[#3b2a8a] shadow-sm"
                                >
                                    <Icon size={14} className="text-[#d6008a]" />
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Product image */}
                        <div className="relative rounded-2xl overflow-hidden border-[3px] border-white shadow-[0_20px_60px_rgba(59,42,138,0.15)] mb-6 max-w-[480px]">
                            <img
                                src="/product.webp"
                                alt="Care N Safe Organic Sanitary Pads"
                                className="w-full h-[210px] object-cover block"
                            />
                            {/* Floating tag */}
                            <div className="absolute bottom-3 left-3">
                                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md text-[11.5px] font-bold text-[#1e1a3a]">
                                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                                    4.9 · 25 Lakh+ Happy Women
                                </div>
                            </div>
                        </div>

                        {/* Testimonials */}
                        <div className="flex flex-col gap-2.5 max-w-[440px]">
                            {TESTIMONIALS.map(({ name, text }) => (
                                <div
                                    key={name}
                                    className="flex items-start gap-3 bg-white border border-violet-100 rounded-2xl px-4 py-3 shadow-sm"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3b2a8a] to-[#d6008a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {name[0]}
                                    </div>
                                    <div>
                                        <p className="text-[12.5px] text-slate-600 italic mb-0.5">"{text}"</p>
                                        <p className="text-[11px] font-bold text-[#d6008a]">— {name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ════ RIGHT: Form ════ */}
                    <div className="flex items-center justify-center lg:justify-end">
                        <SignupForm />
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SignupPage;
