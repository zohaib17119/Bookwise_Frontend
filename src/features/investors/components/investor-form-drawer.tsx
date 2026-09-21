import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiErrorAlert } from "@/components/shared/api-error-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import type { ApiError } from "@/lib/api/types";
import {
  investorFormSchema,
  type InvestorFormValues,
} from "@/features/investors/schemas/investor.schema";
import type { Investor } from "@/features/investors/types/investor.types";
import { useNextInvestorCode } from "@/features/investors/hooks/use-investors";

interface InvestorFormDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  investor?: Investor | null;
  companyId?: string;
  isSubmitting?: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onSubmit: (values: InvestorFormValues) => Promise<void> | void;
}

export function InvestorFormDrawer({
  open,
  mode,
  investor,
  companyId,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: InvestorFormDrawerProps) {
  const nextCodeQuery = useNextInvestorCode(companyId, open && mode === "create");
  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: {
      code: "",
      name: "",
      email: "",
      phone: "",
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && investor) {
      form.reset({
        code: investor.code ?? "",
        name: investor.name,
        email: investor.email ?? "",
        phone: investor.phone ?? "",
        notes: investor.notes ?? "",
        isActive: investor.isActive,
      });
      return;
    }
    form.reset({
      code: nextCodeQuery.data ?? "",
      name: "",
      email: "",
      phone: "",
      notes: "",
      isActive: true,
    });
  }, [open, mode, investor, nextCodeQuery.data, form]);

  return (
    <CreateEditDrawer
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add investor" : "Edit investor"}
      description="Track capital partners and record cash or bank investments."
      footer={
        <>
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={isSubmitting}
            onClick={form.handleSubmit(async (values) => onSubmit(values))}
            type="button"
          >
            {mode === "create" ? "Create investor" : "Save changes"}
          </Button>
        </>
      }
    >
      <ApiErrorAlert error={error} />
      <FieldGrid>
        <FormField label="Code" error={form.formState.errors.code?.message}>
          <Input {...form.register("code")} placeholder="INV-01" />
        </FormField>
        <FormField label="Name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Investor name" />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input {...form.register("email")} placeholder="email@example.com" />
        </FormField>
        <FormField label="Phone" error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} placeholder="Phone" />
        </FormField>
      </FieldGrid>
      <FormField label="Notes" error={form.formState.errors.notes?.message}>
        <Textarea {...form.register("notes")} placeholder="Optional notes" />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", Boolean(checked))}
        />
        Active
      </label>
    </CreateEditDrawer>
  );
}
