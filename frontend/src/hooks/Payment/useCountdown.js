import { useEffect, useState } from "react";

// Milliseconds left until `deadline` (ticks every second, stops at 0); null without a deadline
export const useCountdown = (deadline) => {
  const target = deadline ? new Date(deadline).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return target ? Math.max(0, target - now) : null;
};

// 754000 → "12:34"
export const formatCountdown = (ms) => {
  const totalSeconds = Math.ceil(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
};
