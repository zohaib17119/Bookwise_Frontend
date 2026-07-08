import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormPanel } from "@/features/auth/components/auth-form-panel";
import { AuthIconInput } from "@/features/auth/components/auth-icon-input";
import { AuthPasswordInput } from "@/features/auth/components/auth-password-input";
import { AuthSocialButtons } from "@/features/auth/components/auth-social-buttons";
import { useRegister } from "@/features/auth/hooks/use-register";
import { useInvitePreview } from "@/features/invites/hooks/use-invites";
import {
  type RegisterFormValues,
  registerSchema,
} from "@/features/auth/schemas/register.schema";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api/error";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? undefined;
  const invitedEmail = searchParams.get("email") ?? undefined;
  const registerMutation = useRegister();
  const invitePreviewQuery = useInvitePreview(inviteToken);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: invitedEmail ?? "",
      password: "",
    },
  });

  useEffect(() => {
    if (invitedEmail) {
      form.setValue("email", invitedEmail);
    }
  }, [invitedEmail, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await registerMutation.mutateAsync({
      ...values,
      inviteToken,
    });
    if (result.user.isEmailVerified) {
      navigate("/app/companies", { replace: true });
      return;
    }
    navigate("/verify-email", {
      replace: true,
      state: { email: result.user.email, inviteToken },
    });
  });

  const registerError = registerMutation.error ? toApiError(registerMutation.error) : null;
  const alreadyRegistered = registerError?.status === 409;

  return (
    <AuthFormPanel
      description={
        invitePreviewQuery.data
          ? `You've been invited to join ${invitePreviewQuery.data.companyName} as ${invitePreviewQuery.data.role}. Create your free team account — no subscription required.`
          : "Create your BooksWise account to get started"
      }
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-[#2dd4bf] hover:underline" to="/login">
            Sign in
          </Link>
        </>
      }
      title={invitePreviewQuery.data ? "Join your team" : "Create your account"}
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {registerMutation.error ? (
          alreadyRegistered ? (
            <ApiErrorAlert
              description="Try signing in instead, or use a different email address."
              error={registerMutation.error}
              title="This email is already registered"
            />
          ) : (
            <ApiErrorAlert error={registerMutation.error} fallback="Registration failed" />
          )
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="fullName">
            Full name
          </label>
          <AuthIconInput
            icon={UserRound}
            id="fullName"
            placeholder="Ayesha Khan"
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName?.message ? (
            <p className="text-xs text-red-400">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300" htmlFor="email">
            Email address
          </label>
          <AuthIconInput
            icon={Mail}
            id="email"
            placeholder="you@company.com"
            type="email"
            readOnly={Boolean(invitedEmail)}
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
            placeholder="At least 8 characters"
            {...form.register("password")}
          />
          {form.formState.errors.password?.message ? (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <Button
          className="h-12 w-full rounded-xl bg-[#2dd4bf] text-base font-semibold text-[#0a192f] hover:bg-[#2dd4bf]/90"
          isLoading={registerMutation.isPending}
          type="submit"
        >
          Sign Up
        </Button>

        <AuthSocialButtons />
      </form>
    </AuthFormPanel>
  );
}
