/**
 * OtpInput — 6-box OTP input matching Trendio Ivory Luxe design.
 * Handles auto-focus between boxes, paste, backspace.
 */
import { useRef, useState } from "react";

export default function OtpInput({ length = 6, value = "", onChange }) {
  const inputs = useRef([]);
  const digits  = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? char : d));
    onChange(next.join(""));
    if (char && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = digits.map((d, i) => (i === index - 1 ? "" : d));
        onChange(next.join(""));
        inputs.current[index - 1]?.focus();
      } else {
        const next = digits.map((d, i) => (i === index ? "" : d));
        onChange(next.join(""));
      }
    }
    if (e.key === "ArrowLeft" && index > 0)  inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    const nextFocus = Math.min(pasted.length, length - 1);
    inputs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit === "" ? "" : digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 w-12 rounded-lg border text-center text-xl transition-all duration-150 outline-none focus:border-[#C2A98A] focus:ring-1 focus:ring-[#C2A98A]"
          style={{
            backgroundColor: digit ? "#FFFFFF" : "#EDE3D9",
            borderColor: digit ? "#C2A98A" : "#E5DCD3",
            color: "#2B2B2B",
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
          }}
          placeholder="—"
        />
      ))}
    </div>
  );
}