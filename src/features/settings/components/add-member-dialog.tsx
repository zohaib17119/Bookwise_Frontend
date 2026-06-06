import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import type { ApiError } from "@/lib/api/types";

const addMemberFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "ACCOUNTANT", "STAFF", "VIEWER"], {
    required_error: "Please select a role",
  }),
});

type AddMemberFormValues = z.infer<typeof addMemberFormSchema>;

interface AddMemberDialogProps {
  open: boolean;
  isPending: boolean;
  error: ApiError | null;
  onClose: () => void;
  onSubmit: (values: AddMemberFormValues) => Promise<void> | void;
}

export function AddMemberDialog({
  open,
  isPending,
  error,
  onClose,
  onSubmit,
}: AddMemberDialogProps) {
  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      email: "",
      role: "ACCOUNTANT",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      email: "",
      role: "ACCOUNTANT",
    });
  }, [open, form]);

  return (
    <CreateEditDrawer
      description="Type in a registered user's email and select their company access role."
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            isLoading={isPending}
            onClick={form.handleSubmit(async (values) => onSubmit(values))}
            type="button"
          >
            Add Team Member
          </Button>
        </div>
      }
      onClose={onClose}
      open={open}
      title="Add Team Member"
    >
      <form className="space-y-6">
        {error ? (
          <Alert
            title={error.message}
            variant="destructive"
            className="mb-4"
          />
        ) : null}

        <FormSection
          title="Member Information"
          description="Basic credentials and role level."
        >
          <FieldGrid className="grid-cols-1">
            <FormField
              label="Email Address"
              error={form.formState.errors.email?.message}
            >
              <Input
                {...form.register("email")}
                placeholder="accountant@company.com"
                type="email"
              />
            </FormField>

            <FormField
              label="Membership Role"
              error={form.formState.errors.role?.message}
            >
              <Select
                {...form.register("role")}
                value={form.watch("role")}
                onChange={(e) =>
                  form.setValue(
                    "role",
                    e.target.value as "ADMIN" | "ACCOUNTANT" | "STAFF" | "VIEWER"
                  )
                }
              >
                <option value="ADMIN">Admin (Full operations control)</option>
                <option value="ACCOUNTANT">Accountant (Accounting & books control)</option>
                <option value="STAFF">Staff (Estimates, invoices & bills billing)</option>
                <option value="VIEWER">Viewer (Read-only reports and audits)</option>
              </Select>
            </FormField>
          </FieldGrid>
        </FormSection>
      </form>
    </CreateEditDrawer>
  );
}
