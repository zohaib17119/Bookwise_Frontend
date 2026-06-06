import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { useRegister } from "@/features/auth/hooks/use-register";
import {
  type RegisterFormValues,
  registerSchema,
} from "@/features/auth/schemas/register.schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
    navigate("/app/companies", { replace: true });
  });

  return (
    <AuthFormShell
      title="Create your Bookwise account"
      description="This account becomes the entry point for multi-company access and permissions."
      footer={
        <span className="text-muted-foreground">
          Already registered?{" "}
          <Link className="font-medium text-primary" to="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {registerMutation.error ? (
          <Alert variant="destructive" title={registerMutation.error.message} />
        ) : null}
        <FormField label="Full name" error={form.formState.errors.fullName?.message}>
          <Input placeholder="Ayesha Khan" {...form.register("fullName")} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" placeholder="finance@company.com" {...form.register("email")} />
        </FormField>
        <FormField label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
        </FormField>
        <Button className="w-full" isLoading={registerMutation.isPending} type="submit">
          Create account
        </Button>
      </form>
    </AuthFormShell>
  );
}
