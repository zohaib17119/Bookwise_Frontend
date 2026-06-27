import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { useLogin } from "@/features/auth/hooks/use-login";
import {
  type LoginFormValues,
  loginSchema,
} from "@/features/auth/schemas/login.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/shared/form-field";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/app/companies";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await loginMutation.mutateAsync(values);
    if (result.user.isEmailVerified === false) {
      navigate("/verify-email", { replace: true, state: { email: result.user.email } });
      return;
    }
    navigate(redirectTo, { replace: true });
  });

  return (
    <AuthFormShell
      title="Sign in to your accounting workspace"
      description="Use the same JWT-backed authentication flow as your backend."
      footer={
        <span className="text-muted-foreground">
          New here?{" "}
          <Link className="font-medium text-primary" to="/register">
            Create an account
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {loginMutation.error ? <Alert variant="destructive" title={loginMutation.error.message} /> : null}
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" placeholder="finance@company.com" {...form.register("email")} />
        </FormField>
        <FormField label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...form.register("password")} />
        </FormField>
        <Button className="w-full" isLoading={loginMutation.isPending} type="submit">
          Sign in
        </Button>
      </form>
    </AuthFormShell>
  );
}
