"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// --- Types ---

interface User {
  id: number;
  userCode: string;
  username: string;
  isAdmin: boolean;
}

interface Permission {
  module: string;
  viewAll: boolean;
  viewDetails: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const MODULES = ["SALES", "SETUP", "PROJECT", "ACCOUNT", "WAREHOUSE", "REPORTS"] as const;
const PERM_FIELDS = ["viewAll", "viewDetails", "canAdd", "canEdit", "canDelete"] as const;
const PERM_LABELS: Record<string, string> = {
  viewAll: "View All",
  viewDetails: "View Details",
  canAdd: "Can Add",
  canEdit: "Can Edit",
  canDelete: "Can Delete",
};

function getEmptyPermissions(): Permission[] {
  return MODULES.map((module) => ({
    module,
    viewAll: false,
    viewDetails: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }));
}

// --- Component ---

export default function PermissionsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const userIdFromUrl = searchParams.get("userId");

  const [selectedUserId, setSelectedUserId] = React.useState<string>(
    userIdFromUrl ?? ""
  );
  const [permissions, setPermissions] = React.useState<Permission[]>(
    getEmptyPermissions()
  );

  // Fetch all users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<User>>(
        "/api/admin/users?pageSize=500&sortBy=username&sortOrder=asc"
      ),
  });

  const users = usersData?.data ?? [];
  const selectedUser = users.find((u) => String(u.id) === selectedUserId);

  // Fetch permissions for selected user
  const { data: existingPermissions, isLoading: loadingPerms } = useQuery({
    queryKey: ["admin-permissions", selectedUserId],
    queryFn: () =>
      fetchApi<Permission[]>(
        `/api/admin/users/${selectedUserId}/permissions`
      ),
    enabled: !!selectedUserId,
  });

  // Update local state when permissions load
  React.useEffect(() => {
    if (existingPermissions) {
      const merged = getEmptyPermissions().map((empty) => {
        const existing = existingPermissions.find(
          (p) => p.module === empty.module
        );
        return existing
          ? {
              module: existing.module,
              viewAll: existing.viewAll,
              viewDetails: existing.viewDetails,
              canAdd: existing.canAdd,
              canEdit: existing.canEdit,
              canDelete: existing.canDelete,
            }
          : empty;
      });
      setPermissions(merged);
    } else if (!selectedUserId) {
      setPermissions(getEmptyPermissions());
    }
  }, [existingPermissions, selectedUserId]);

  // Save permissions
  const saveMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/api/admin/users/${selectedUserId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-permissions", selectedUserId],
      });
      toast.success("Permissions saved successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function togglePermission(module: string, field: keyof Permission) {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === module ? { ...p, [field]: !p[field] } : p
      )
    );
  }

  function toggleAllForModule(module: string, value: boolean) {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === module
          ? {
              ...p,
              viewAll: value,
              viewDetails: value,
              canAdd: value,
              canEdit: value,
              canDelete: value,
            }
          : p
      )
    );
  }

  function isAllChecked(module: string): boolean {
    const p = permissions.find((perm) => perm.module === module);
    if (!p) return false;
    return p.viewAll && p.viewDetails && p.canAdd && p.canEdit && p.canDelete;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Permissions</h1>
        <p className="text-sm text-zinc-500">
          Configure module-level access controls for users.
        </p>
      </div>

      {/* User Selection */}
      <div className="flex items-end gap-4">
        <div className="space-y-1 w-[300px]">
          <Label htmlFor="user-select">Select User</Label>
          <Select
            id="user-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <SelectOption value="">Choose a user...</SelectOption>
            {users.map((u) => (
              <SelectOption key={u.id} value={String(u.id)}>
                {u.username} ({u.userCode})
              </SelectOption>
            ))}
          </Select>
        </div>
        {selectedUser && (
          <div className="pb-1">
            <p className="text-sm text-zinc-500">
              {selectedUser.isAdmin && (
                <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 mr-2">
                  Admin
                </span>
              )}
              {selectedUser.username} &middot; {selectedUser.userCode}
            </p>
          </div>
        )}
      </div>

      {selectedUser?.isAdmin && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-300">
          Admin users have full access to all modules. Permissions below are
          saved but only enforced for non-admin users.
        </div>
      )}

      {/* Permissions Matrix */}
      {selectedUserId && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {loadingPerms ? (
            <div className="p-8 text-center text-zinc-500">
              Loading permissions...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Module
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500 w-16">
                    All
                  </th>
                  {PERM_FIELDS.map((field) => (
                    <th
                      key={field}
                      className="px-4 py-3 text-center font-medium text-zinc-500"
                    >
                      {PERM_LABELS[field]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr
                    key={perm.module}
                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3 font-medium">{perm.module}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllChecked(perm.module)}
                        onChange={(e) =>
                          toggleAllForModule(perm.module, e.target.checked)
                        }
                        className="rounded"
                      />
                    </td>
                    {PERM_FIELDS.map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm[field] as boolean}
                          onChange={() => togglePermission(perm.module, field)}
                          className="rounded"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Save Button */}
      {selectedUserId && (
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !selectedUserId}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      )}

      {!selectedUserId && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
          Select a user above to manage their permissions.
        </div>
      )}
    </div>
  );
}
