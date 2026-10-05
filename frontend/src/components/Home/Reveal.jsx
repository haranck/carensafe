import { m } from "framer-motion";

// Subtle one-time fade-in for page sections (needs a LazyMotion ancestor)
const Reveal = ({ className = "", children, ...props }) => (
  <m.section
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </m.section>
);

export default Reveal;
