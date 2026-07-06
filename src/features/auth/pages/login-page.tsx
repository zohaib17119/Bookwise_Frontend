import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthFormPanel } from "@/features/auth/components/auth-form-panel";
import { AuthIconInput } from "@/features/auth/components/auth-icon-input";
import { AuthPasswordInput } from "@/features/auth/components/auth-password-input";
import { AuthSocialButtons } from "@/features/auth/components/auth-social-buttons";
import { useLogin } from "@/features/auth/hooks/use-login";
import {
  type LoginFormValues,
  loginSchema,
} from "@/features/auth/schemas/login.schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const REMEMBER_EMAIL_KEY = "bookswise.rememberEmail";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/app/companies";
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      form.setValue("email", savedEmail);
      setRememberMe(true);
    }
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, values.email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    const result = await loginMutation.mutateAsync({
      email: values.email,
      password: values.password,
    });
    if (result.user.isEmailVerified === false) {
      navigate("/verify-email", { replace: true, state: { email: result.user.email } });
      return;
    }
    navigate(redirectTo, { replace: true });
  });

  return (
    <AuthFormPanel
      description="Sign in to your BooksWise account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-[#2dd4bf] hover:underline" to="/register">
            Sign up
          </Link>
        </>
      }
      title="Welcome back!"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {loginMutation.error ? (
          <Alert variant="destructive" title={loginMutation.error.message} />
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="email">
            Email address
          </label>
          <AuthIconInput
            icon={Mail}
            id="email"
            placeholder="you@company.com"
            type="email"
            {...form.register("email")}
          />
          {form.formState.errors.email?.message ? (
            <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="password">
            Password
          </label>
          <AuthPasswordInput
            id="password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password?.message ? (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <Checkbox
              checked={rememberMe}
              className="border-white/20 bg-[#112240] text-[#2dd4bf]"
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
          <span
            className="cursor-not-allowed text-sm text-[#2dd4bf]/60"
            title="Coming soon"
          >
            Forgot password?
          </span>
        </div>

        <Button
          className="h-12 w-full rounded-xl bg-[#2dd4bf] text-base font-semibold text-[#0a192f] hover:bg-[#2dd4bf]/90"
          isLoading={loginMutation.isPending}
          type="submit"
        >
          Sign In
        </Button>

        <AuthSocialButtons />
      </form>
    </AuthFormPanel>
  );
}
