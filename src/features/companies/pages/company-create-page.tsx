import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCreateCompany } from "@/features/companies/hooks/use-create-company";
import {
  createCompanySchema,
  type CreateCompanyFormValues,
} from "@/features/companies/schemas/create-company.schema";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function CompanyCreatePage() {
  const createCompanyMutation = useCreateCompany();
  const user = useAuthStore((state) => state.user);
  
  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      legalName: "",
      currencyCode: "USD",
      baseCurrencyCode: "",
      timezone: "",
      fiscalYearStartMonth: 1,
      ownerUserId:user?.id
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createCompanyMutation.mutateAsync(values);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create company"
        description="This seeds the company-scoped routes used by all future accounting modules."
      />

      <div className="surface max-w-2xl p-6">
        <form className="space-y-5" onSubmit={onSubmit}>
          {createCompanyMutation.error ? (
            <Alert
              variant="destructive"
              title={createCompanyMutation.error.message}
            />
          ) : null}

          <FormField label="Company name" error={form.formState.errors.name?.message}>
            <Input placeholder="Northwind Holdings" {...form.register("name")} />
          </FormField>

          <FormField label="Legal name" error={form.formState.errors.legalName?.message}>
            <Input placeholder="Northwind Holdings LLC" {...form.register("legalName")} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Currency Code" error={form.formState.errors.currencyCode?.message}>
              <Input placeholder="USD" {...form.register("currencyCode")} />
            </FormField>

            <FormField label="Base Currency Code (optional)" error={form.formState.errors.baseCurrencyCode?.message}>
              <Input placeholder="USD" {...form.register("baseCurrencyCode")} />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Timezone" error={form.formState.errors.timezone?.message}>
              <Input placeholder="Asia/Karachi" {...form.register("timezone")} />
            </FormField>

            <FormField
              label="Fiscal Year Start Month"
              error={form.formState.errors.fiscalYearStartMonth?.message}
            >
              <Input
                type="number"
                min={1}
                max={12}
                {...form.register("fiscalYearStartMonth", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button isLoading={createCompanyMutation.isPending} type="submit">
              Create company
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
