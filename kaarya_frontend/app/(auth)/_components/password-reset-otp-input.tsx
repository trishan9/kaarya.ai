"use client";

import { Fragment, type FocusEventHandler, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

type PasswordResetOtpInputProps = {
  id?: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

function sanitizeOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

function toOtpSlots(value: string) {
  const digits = sanitizeOtp(value);
  return Array.from({ length: OTP_LENGTH }, (_, index) => digits[index] ?? "");
}

export function PasswordResetOtpInput({
  id = "password-reset-otp",
  value,
  disabled = false,
  invalid = false,
  onChange,
  onBlur,
}: PasswordResetOtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const slots = useMemo(() => toOtpSlots(value), [value]);

  const setFocus = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    const target = inputRefs.current[boundedIndex];
    if (!target) return;
    target.focus();
    target.select();
  };

  const updateSlots = (nextSlots: string[]) => {
    onChange(nextSlots.join(""));
  };

  const applyDigits = (startIndex: number, rawDigits: string) => {
    const digits = sanitizeOtp(rawDigits);
    if (!digits.length) return;

    const nextSlots = [...slots];
    let cursor = startIndex;

    for (const digit of digits) {
      if (cursor >= OTP_LENGTH) break;
      nextSlots[cursor] = digit;
      cursor += 1;
    }

    updateSlots(nextSlots);

    const nextFocusableIndex = cursor >= OTP_LENGTH ? OTP_LENGTH - 1 : cursor;
    setFocus(nextFocusableIndex);
  };

  return (
    <div
      role="group"
      aria-label="One-time verification code"
      className="flex items-center justify-between"
    >
      {slots.map((digit, index) => (
        <Fragment key={`${id}-${index}`}>
          <Input
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            id={`${id}-${index + 1}`}
            value={digit}
            type="text"
            disabled={disabled}
            maxLength={OTP_LENGTH}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : undefined}
            aria-label={`Verification code digit ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={invalid}
            className={cn(
              "h-12 w-10 rounded-md px-0 text-center text-lg font-semibold tabular-nums md:w-12",
              invalid && "border-destructive"
            )}
            onChange={(event) => {
              const rawValue = event.target.value;
              const nextValue = sanitizeOtp(rawValue);
              if (!nextValue.length) {
                if (rawValue.length > 0) {
                  return;
                }
                const nextSlots = [...slots];
                nextSlots[index] = "";
                updateSlots(nextSlots);
                return;
              }

              if (nextValue.length === 1) {
                const nextSlots = [...slots];
                nextSlots[index] = nextValue;
                updateSlots(nextSlots);
                if (index < OTP_LENGTH - 1) {
                  setFocus(index + 1);
                }
                return;
              }

              applyDigits(index, nextValue);
            }}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowLeft":
                  event.preventDefault();
                  setFocus(index - 1);
                  return;
                case "ArrowRight":
                  event.preventDefault();
                  setFocus(index + 1);
                  return;
                case "Home":
                  event.preventDefault();
                  setFocus(0);
                  return;
                case "End":
                  event.preventDefault();
                  setFocus(OTP_LENGTH - 1);
                  return;
                case "Backspace": {
                  event.preventDefault();
                  const nextSlots = [...slots];

                  if (nextSlots[index]) {
                    nextSlots[index] = "";
                    updateSlots(nextSlots);
                    return;
                  }

                  if (index > 0) {
                    nextSlots[index - 1] = "";
                    updateSlots(nextSlots);
                    setFocus(index - 1);
                  }
                  return;
                }
                case "Delete": {
                  event.preventDefault();
                  const nextSlots = [...slots];
                  nextSlots[index] = "";
                  updateSlots(nextSlots);
                  return;
                }
                default:
                  return;
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pastedData = event.clipboardData.getData("text");
              applyDigits(index, pastedData);
            }}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            onBlur={onBlur}
          />

          {index < OTP_LENGTH - 1 && (
            <span
              aria-hidden="true"
              className="text-muted-foreground px-1 text-base font-semibold"
            >
              -
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
