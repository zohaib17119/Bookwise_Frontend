import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import {
  useResendVerification,
  useVerifyEmail,
} from "@/features/auth/hooks/use-verify-email";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyEmailLocationState {
  email?: string;
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = useAuthStore((state) => state.user);

  const email = useMemo(() => {
    const stateEmail = (location.state as VerifyEmailLocationState | null)?.email;
    return stateEmail ?? storedUser?.email ?? "";
  }, [location.state, storedUser?.email]);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const code = digits.join("");

  const focusInput = (index: number) => {
    const target = inputsRef.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const submitCode = async (value: string) => {
    try {
      await verifyMutation.mutateAsync({ email, code: value });
      navigate("/app/companies", { replace: true });
    } catch {
      setDigits(Array(CODE_LENGTH).fill(""));
      focusInput(0);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      const chars = value.split("");
      let cursor = index;
      for (const char of chars) {
        if (cursor >= CODE_LENGTH) {
          break;
        }
        next[cursor] = char;
        cursor += 1;
      }
      const filled = next.join("");
      if (filled.length === CODE_LENGTH && !filled.includes("")) {
        void submitCode(filled);
      } else {
        focusInput(Math.min(cursor, CODE_LENGTH - 1));
      }
      return next;
    });
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) {
      return;
    }
    event.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, idx) => {
      next[idx] = char;
    });
    setDigits(next);
    if (pasted.length === CODE_LENGTH) {
      void submitCode(pasted);
    } else {
      focusInput(pasted.length);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length === CODE_LENGTH) {
      void submitCode(code);
    }
  };

  const handleResend = async () => {
    setResendNotice(null);
    try {
      await resendMutation.mutateAsync({ email });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResendNotice("We sent a fresh code to your inbox.");
    } catch {
      // Error surfaced via resendMutation.error below.
    }
  };

  return (
    <AuthFormShell
      title="Verify your email"
      description={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <span className="text-muted-foreground">
          Wrong address?{" "}
          <Link className="font-medium text-primary" to="/register">
            Start over
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {verifyMutation.error ? (
          <Alert variant="destructive" title={verifyMutation.error.message} />
        ) : null}
        {resendMutation.error ? (
          <Alert variant="destructive" title={resendMutation.error.message} />
        ) : null}
        {resendNotice ? <Alert variant="success" title={resendNotice} /> : null}

        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onFocus={(event) => event.target.select()}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`Digit ${index + 1}`}
              autoFocus={index === 0}
              className="h-14 w-full rounded-lg border border-input bg-background text-center text-xl font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          ))}
        </div>

        <Button
          className="w-full"
          isLoading={verifyMutation.isPending}
          disabled={code.length !== CODE_LENGTH}
          type="submit"
        >
          Verify email
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            className="font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleResend}
            disabled={cooldown > 0 || resendMutation.isPending}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    </AuthFormShell>
  );
}
