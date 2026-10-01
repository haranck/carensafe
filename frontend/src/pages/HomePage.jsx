import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import { useSelector } from "react-redux";
import { ShoppingBag, Heart, Package, Star, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbff] font-sans">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-[1100px] mx-auto">

          {/* Welcome banner */}
          <div
            className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#3b2a8a 0%,#7c3aed 50%,#d6008a 100%)" }}
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-white/5 blur-[60px] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[13px] font-medium text-white/70 mb-1">Welcome back,</p>
              <h1 className="text-[28px] font-extrabold mb-2">
                {user?.firstName || "User"} {user?.lastName || ""} 👋
              </h1>
              <p className="text-[14px] text-white/80 max-w-[500px]">
                Your organic period care journey continues. Explore our latest products and exclusive offers.
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { icon: ShoppingBag, label: "Shop Products", to: "/shop",    color: "text-violet-500" },
              { icon: Package,     label: "My Orders",     to: "/orders",  color: "text-blue-500"   },
              { icon: Heart,       label: "Wishlist",       to: "/wishlist", color: "text-pink-500"   },
              { icon: Star,        label: "Rewards",        to: "#",        color: "text-amber-500"  },
            ].map(({ icon: Icon, label, to, color }) => (
              <Link
                key={label}
                to={to}
                className="flex flex-col items-center gap-2.5 bg-white border border-slate-100 rounded-2xl p-6 no-underline hover:shadow-[0_8px_24px_rgba(59,42,138,0.10)] hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} />
                </div>
                <span className="text-[13px] font-semibold text-[#1e1a3a]">{label}</span>
              </Link>
            ))}
          </div>

          {/* Featured products placeholder */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-extrabold text-[#1e1a3a]">
                <Sparkles size={18} className="inline text-[#d6008a] mr-1.5 -mt-0.5" />
                Featured Products
              </h2>
              <Link to="/shop" className="text-[13px] font-semibold text-[#1a56db] no-underline flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: "Ultra Thin Day Pad",    price: "₹199", tag: "Best Seller" },
                { name: "XL Night Comfort Pad",  price: "₹249", tag: "Popular"     },
                { name: "Panty Liner (Pack of 30)", price: "₹149", tag: "New"       },
              ].map(({ name, price, tag }) => (
                <div key={name} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-[0_8px_24px_rgba(59,42,138,0.10)] hover:-translate-y-1 transition-all duration-200 group">
                  <div className="h-40 bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center relative">
                    <img src="/product.webp" alt={name} className="h-28 object-contain" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-[#d6008a] text-white px-2.5 py-1 rounded-full">{tag}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[14px] font-bold text-[#1e1a3a] mb-1">{name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[16px] font-extrabold bg-gradient-to-r from-[#3b2a8a] to-[#d6008a] bg-clip-text text-transparent">{price}</span>
                      <button className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#1a56db] text-white hover:opacity-90 transition-all border-none cursor-pointer">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
