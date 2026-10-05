import { useId, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { Clock, Mail, MapPin, Package, Phone } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import ContactForm from "../../components/Contact/ContactForm";
import { COMPANY } from "../../constants/company";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const CARD = "rounded-2xl border border-slate-100 bg-white shadow-[0_10px_30px_-20px_rgba(59,42,138,0.35)]";

const CONTACT_ITEMS = [
  { icon: Phone, label: "Call us (toll-free)", value: COMPANY.phoneDisplay, href: COMPANY.phoneHref },
  { icon: Mail, label: "Email", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { icon: MapPin, label: COMPANY.legalName, value: COMPANY.address, href: COMPANY.mapsUrl, external: true },
  { icon: Clock, label: "Support hours", value: `${COMPANY.hours} · replies within 1 working day` },
];

// Contact Us: ways to reach us + the message form (emailed to the team inbox)
const ContactPage = () => {
  const headingId = useId();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  usePageTitle("Contact Us");

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <section aria-labelledby={headingId} className={`${CONTAINER} pt-8 pb-16 sm:pt-12`}>
              <m.div
                className="mx-auto max-w-[1100px]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="max-w-[640px]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d6008a]" />
                    Contact us
                  </span>
                  <h1 id={headingId} className="mt-4 text-[32px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[44px]">
                    We&apos;re here to <span className="font-accent font-medium italic text-[#d6008a]">help</span>
                  </h1>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                    Questions about an order, the right size or bulk orders for your workplace or school? Write to us — a real
                    person from our Chennai team will get back to you.
                  </p>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start">
                  <div className="flex flex-col gap-3">
                    {CONTACT_ITEMS.map(({ icon: Icon, label, value, href, external }) => {
                      const content = (
                        <>
                          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff5fa] text-[#d6008a]">
                            <Icon size={20} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11.5px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
                            <span className="mt-0.5 block break-words text-[14.5px] font-semibold text-[#1e1a3a]">{value}</span>
                          </span>
                        </>
                      );
                      return href ? (
                        <a
                          key={label}
                          href={href}
                          {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                          className={`${CARD} flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-pink-200 ${FOCUS_RING}`}
                        >
                          {content}
                        </a>
                      ) : (
                        <div key={label} className={`${CARD} flex items-center gap-3 p-4`}>
                          {content}
                        </div>
                      );
                    })}

                    <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffe4f2] via-[#f8eeff] to-[#e9e0ff] pl-4">
                      <div className="min-w-0 flex-1 py-4">
                        <p className="text-[14px] font-bold text-[#1e1a3a]">Tracking an order?</p>
                        <p className="mt-0.5 text-[12.5px] text-slate-600">See live status, cancel or return from My Orders.</p>
                        <Link
                          to={FRONTEND_ROUTES.ORDERS}
                          className={`mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] ${FOCUS_RING}`}
                        >
                          <Package size={15} aria-hidden="true" /> My Orders
                        </Link>
                      </div>
                      <img src="/auth/girl-half-body-560.webp" alt="" width={560} height={531} loading="lazy" className="h-32 w-auto flex-shrink-0 self-end object-contain" />
                    </div>
                  </div>

                  <div className={`${CARD} relative order-first p-5 sm:p-8 lg:order-none`}>
                    <h2 className="text-[20px] font-extrabold text-[#1e1a3a]">Send us a message</h2>
                    <p className="mb-5 mt-1 text-[13.5px] text-slate-500">We&apos;ll email you a copy and reply within 1 working day.</p>
                    <ContactForm />
                  </div>
                </div>
              </m.div>
            </section>
          </main>
        </MotionConfig>
      </LazyMotion>
      <Footer />
    </div>
  );
};

export default ContactPage;
