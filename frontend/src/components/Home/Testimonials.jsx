import { useId } from "react";
import { Quote, Star } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { BRAND_GRADIENT, CONTAINER } from "../../constants/customerTheme";

// TODO: placeholder quotes reused from the auth pages; replace with real customer reviews
const TESTIMONIALS = [
  { name: "Ananya R.", text: "Finally a brand I trust completely!" },
  { name: "Meera S.", text: "Softest pads I've ever used. No more rashes." },
];

const Testimonials = () => {
  const headingId = useId();

  return (
    <Reveal aria-labelledby={headingId} className="bg-gradient-to-br from-[#fff5fa] via-[#fdf7fd] to-[#f3eeff]">
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <SectionHeading id={headingId} eyebrow="Loved by Women" before="What our" accent="customers" after="say" />

        <ul className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map(({ name, text }) => (
            <li key={name} className="flex flex-col rounded-2xl border border-pink-100 bg-white p-6">
              <Quote size={26} aria-hidden="true" className="text-pink-200" />
              <p className="mt-3 flex-1 font-accent text-[19px] font-medium italic leading-snug text-[#1e1a3a]">“{text}”</p>
              <div className="mt-5 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3b2a8a] to-[#d6008a] text-[14px] font-bold text-white"
                >
                  {name[0]}
                </span>
                <span className="text-[13px] font-bold text-[#d6008a]">{name}</span>
              </div>
            </li>
          ))}

          <li className={`flex flex-col justify-center rounded-2xl p-6 text-white ${BRAND_GRADIENT}`}>
            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} className="fill-amber-300 text-amber-300" />
              ))}
            </div>
            <p className="mt-3 text-[40px] font-extrabold leading-none">4.9</p>
            <p className="mt-2 text-[14px] font-medium text-white/85">Average rating from 25 Lakh+ happy women</p>
          </li>
        </ul>
      </div>
    </Reveal>
  );
};

export default Testimonials;
