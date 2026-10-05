import { useId } from "react";
import Reveal from "../Home/Reveal";
import SectionHeading from "../Home/SectionHeading";
import TechnologyCard from "./TechnologyCard";
import { TECHNOLOGIES } from "./technologyData";
import { CONTAINER } from "../../constants/customerTheme";

// "Care N Safe — 11-in-1 Technology": alternating cards (tile left / right) on a soft blush band
const TechnologySection = () => {
  const headingId = useId();
  return (
    <Reveal aria-labelledby={headingId} className="bg-gradient-to-b from-white via-[#fff7fb] to-white py-12 md:py-16">
      <div className={CONTAINER}>
        <div className="mx-auto max-w-[1100px]">
          <SectionHeading
            id={headingId}
            eyebrow="11-in-1 Technology"
            before="Care N Safe:"
            accent="science + nature"
            after="in every pad"
            description="Eleven layers of thoughtful protection, comfort and intimate hygiene, working together."
          />
          <ol className="flex flex-col gap-5 sm:gap-6">
            {TECHNOLOGIES.map((technology, index) => (
              <li key={technology.title}>
                <TechnologyCard index={index} technology={technology} flip={index % 2 === 1} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Reveal>
  );
};

export default TechnologySection;
