import { useState } from "react";
import { Plus, Shield, ShieldAlert, UserCheck, UserMinus, UserX } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canUsePermission } from "@/features/permissions/utils/module-permissions";
import {
  useAddCompanyMember,
  useCompanyMembers,
  useUpdateCompanyMember,
} from "@/features/permissions/hooks/use-team";
import type { CompanyMember, CompanyMemberRole, CompanyMemberStatus } from "@/features/permissions/api/team.api";
import { AddMemberDialog } from "@/features/settings/components/add-member-dialog";
import type { ApiError } from "@/lib/api/types";
import { formatDate } from "@/lib/utils/format";

export function SettingsTeamPage() {
  const { companyId, permissions } = useActiveCompany();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const canView = canUsePermission(permissions, [
    "company.view",
    "settings.read",
    "settings.manage",
  ]);
  const canManage = canUsePermission(permissions, [
    "company.update",
    "settings.manage",
  ]);

  const membersQuery = useCompanyMembers(companyId);
  const addMemberMutation = useAddCompanyMember(companyId);
  const updateMemberMutation = useUpdateCompanyMember(companyId);

  if (!canView) {
    return (
      <ErrorState
        title="Team settings access restricted"
        description="Your current company membership does not include team administration visibility."
      />
    );
  }

  const handleInviteSubmit = async (values: { email: string; role: string }) => {
    try {
      await addMemberMutation.mutateAsync({
        email: values.email,
        role: values.role as CompanyMemberRole,
        status: "ACTIVE",
      });
      setIsInviteOpen(false);
    } catch (e) {
      // Handled inside mutation error state
    }
  };

  const handleRoleChange = async (member: CompanyMember, newRole: CompanyMemberRole) => {
    try {
      await updateMemberMutation.mutateAsync({
        memberId: member.id,
        payload: { role: newRole },
      });
    } catch (e) {
      // Handle error
    }
  };

  const handleStatusChange = async (member: CompanyMember, newStatus: CompanyMemberStatus) => {
    try {
      await updateMemberMutation.mutateAsync({
        memberId: member.id,
        payload: { status: newStatus },
      });
    } catch (e) {
      // Handle error
    }
  };

  const roleBadges: Record<CompanyMemberRole, string> = {
    OWNER: "bg-purple-50 text-purple-700 border-purple-200",
    ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
    ACCOUNTANT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    STAFF: "bg-amber-50 text-amber-700 border-amber-200",
    VIEWER: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const statusBadges: Record<CompanyMemberStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700 border-green-200",
    INVITED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
    REMOVED: "bg-slate-100 text-slate-600 border-slate-300",
  };

  const columns: DataTableColumn<CompanyMember>[] = [
    {
      key: "user",
      header: "Member / Email",
      render: (member) => (
        <div>
          <p className="font-semibold text-foreground">{member.user.fullName}</p>
          <p className="text-xs text-muted-foreground">{member.user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (member) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            roleBadges[member.role]
          }`}
        >
          {member.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (member) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            statusBadges[member.status]
          }`}
        >
          {member.status}
        </span>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined Date",
      render: (member) => (
        <span className="text-xs text-muted-foreground">
          {member.joinedAt ? formatDate(member.joinedAt) : "Pending Invite"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (member) => {
        if (!canManage || member.role === "OWNER") {
          return <span className="text-xs text-muted-foreground italic">Restricted</span>;
        }

        return (
          <div className="flex justify-end gap-2 items-center">
            {/* Role Dropdown */}
            <Select
              className="h-8 max-w-[130px] text-xs py-0 px-2 rounded-lg"
              onChange={(e) => handleRoleChange(member, e.target.value as CompanyMemberRole)}
              value={member.role}
              disabled={updateMemberMutation.isPending}
            >
              <option value="ADMIN">Admin</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="STAFF">Staff</option>
              <option value="VIEWER">Viewer</option>
            </Select>

            {/* Suspend / Revive */}
            {member.status === "ACTIVE" ? (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0 flex items-center justify-center rounded-lg"
                title="Suspend Member"
                onClick={() => handleStatusChange(member, "SUSPENDED")}
                disabled={updateMemberMutation.isPending}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            ) : member.status === "SUSPENDED" ? (
              <Button
                size="sm"
                className="h-8 w-8 p-0 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700"
                title="Revive Member"
                onClick={() => handleStatusChange(member, "ACTIVE")}
                disabled={updateMemberMutation.isPending}
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            ) : null}

            {/* Remove */}
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 border-none"
              title="Remove Member"
              onClick={() => handleStatusChange(member, "REMOVED")}
              disabled={updateMemberMutation.isPending}
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {updateMemberMutation.error ? (
        <Alert
          title={(updateMemberMutation.error as ApiError).message}
          variant="destructive"
        />
      ) : null}

      <SettingsSectionCard
        description="View and administer company staff, accountants, and permission roles."
        title="Team Members"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Total Members: <span className="font-semibold text-foreground">{membersQuery.data?.length ?? 0}</span>
            </p>
            {canManage ? (
              <Button size="sm" onClick={() => setIsInviteOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Team Member
              </Button>
            ) : null}
          </div>

          {membersQuery.error ? (
            <ErrorState
              title="Unable to load team members"
              description={membersQuery.error.message}
            />
          ) : (
            <DataTable
              columns={columns}
              data={membersQuery.data ?? []}
              emptyDescription="No team members added yet."
              emptyTitle="No members found"
              getRowKey={(member) => member.id}
              isLoading={membersQuery.isLoading}
            />
          )}
        </div>
      </SettingsSectionCard>

      <AddMemberDialog
        open={isInviteOpen}
        isPending={addMemberMutation.isPending}
        error={addMemberMutation.error as ApiError | null}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInviteSubmit}
      />
    </div>
  );
}
