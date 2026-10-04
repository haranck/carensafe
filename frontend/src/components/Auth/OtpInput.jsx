import { useRef } from "react";

const LENGTH = 6;

/**
 * Six one-digit boxes for a verification code. `value` is the code so far ("12" → two boxes filled).
 * Typing moves forward, Backspace moves back, arrows move between boxes, pasting a code fills them all.
 */
const OtpInput = ({ value, onChange, disabled = false, hasError = false, label = "Verification code" }) => {
  const inputsRef = useRef([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || "");

  const focusBox = (index) => inputsRef.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  const setDigit = (index, digit) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join("").slice(0, LENGTH));
  };

  const handleChange = (e, index) => {
    const typed = e.target.value.replace(/\D/g, "");
    if (!typed) return;
    // Autofill / typing over a filled box: spread the digits from here on
    if (typed.length > 1) {
      const next = [...digits];
      typed.split("").forEach((digit, offset) => {
        if (index + offset < LENGTH) next[index + offset] = digit;
      });
      onChange(next.join("").slice(0, LENGTH));
      focusBox(index + typed.length);
      return;
    }
    setDigit(index, typed);
    focusBox(index + 1);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) setDigit(index, "");
      else if (index > 0) {
        setDigit(index - 1, "");
        focusBox(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focusBox(pasted.length);
  };

  return (
    <div role="group" aria-label={label} className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-10 rounded-xl border bg-slate-50 text-center text-[20px] font-bold text-slate-800 outline-none transition-all focus:border-[#d6008a] focus:bg-white focus:ring-1 focus:ring-[#d6008a] disabled:opacity-60 sm:h-14 sm:w-12 ${hasError ? "border-rose-400" : "border-slate-200"}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
