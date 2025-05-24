import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  className,
  disabled = false,
}: OTPInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update internal state when value prop changes
    const newDigits = Array(length).fill("");
    for (let i = 0; i < Math.min(value.length, length); i++) {
      newDigits[i] = value[i] || "";
    }
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Update parent component
    onChange(newDigits.join(""));

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Focus previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    const newDigits = Array(length).fill("");

    for (let i = 0; i < Math.min(pastedData.length, length); i++) {
      newDigits[i] = pastedData[i];
    }

    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Focus the next empty input or the last input
    const nextEmptyIndex = newDigits.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold rounded-lg border-2 border-input bg-background",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200"
          )}
        />
      ))}
    </div>
  );
}
