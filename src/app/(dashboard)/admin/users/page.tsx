"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface User {
  id: number;
  userCode: string;
  username: string;
  branchCode: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Branch {
  id: number;
  branchCode: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schemas ---

const createUserFormSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  userCode: z.string().min(1, "User code is required").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchCode: z.string().min(1, "Branch is required"),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
});

const editUserFormSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  userCode: z.string().min(1, "User code is required").max(50),
  branchCode: z.string().min(1, "Branch is required"),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
});

const changePasswordFormSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;
type EditUserFormData = z.infer<typeof editUserFormSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

// --- Component ---

export default function UsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [passwordUser, setPasswordUser] = React.useState<User | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterActive, setFilterActive] = React.useState("");
  const [filterAdmin, setFilterAdmin] = React.useState("");

  // --- Data fetching ---

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (filterActive) params.set("isActive", filterActive);
    if (filterAdmin) params.set("isAdmin", filterAdmin);
    return params.toString();
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", search, filterActive, filterAdmin],
    queryFn: () =>
      fetchApi<PaginatedResponse<User>>(`/api/admin/users?${buildParams()}`),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<Branch>>(
        "/api/admin/branches"
      ).then((r) => r.data),
  });

  // --- Forms ---

  const createForm = useForm<CreateUserFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createUserFormSchema) as any,
    defaultValues: {
      username: "",
      userCode: "",
      password: "",
      branchCode: "",
      isAdmin: false,
      isActive: true,
    },
  });

  const editForm = useForm<EditUserFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editUserFormSchema) as any,
    defaultValues: {
      username: "",
      userCode: "",
      branchCode: "",
      isAdmin: false,
      isActive: true,
    },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(changePasswordFormSchema) as any,
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      fetchApi<User>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User created successfully");
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditUserFormData) =>
      fetchApi<User>(`/api/admin/users/${editingUser!.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { id: number; newPassword: string }) =>
      fetchApi(`/api/admin/users/${data.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: data.newPassword }),
      }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordDialogOpen(false);
      setPasswordUser(null);
      passwordForm.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleOpenCreate() {
    createForm.reset({
      username: "",
      userCode: "",
      password: "",
      branchCode: "",
      isAdmin: false,
      isActive: true,
    });
    setCreateDialogOpen(true);
  }

  function handleOpenEdit(user: User) {
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      userCode: user.userCode,
      branchCode: user.branchCode,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  }

  function handleOpenPassword(user: User) {
    setPasswordUser(user);
    passwordForm.reset({ newPassword: "", confirmPassword: "" });
    setPasswordDialogOpen(true);
  }

  function handleDelete(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createForm.handleSubmit((data) => createMutation.mutate(data))(e);
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    editForm.handleSubmit((data) => updateMutation.mutate(data))(e);
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    passwordForm.handleSubmit((data) =>
      changePasswordMutation.mutate({
        id: passwordUser!.id,
        newPassword: data.newPassword,
      })
    )(e);
  }

  // --- Columns ---

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: "userCode", header: "User Code" },
    { accessorKey: "username", header: "Username" },
    { accessorKey: "branchCode", header: "Branch" },
    {
      accessorKey: "isAdmin",
      header: "Admin",
      cell: ({ row }) =>
        row.original.isAdmin ? (
          <Badge variant="warning">Admin</Badge>
        ) : (
          <span className="text-zinc-400">-</span>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Edit user"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Change password"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPassword(row.original);
            }}
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Manage permissions"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/permissions?userId=${row.original.id}`);
            }}
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete user"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const colorRules: ColorRule<User>[] = [
    {
      condition: (row) => !row.isActive,
      className: "bg-gray-50 dark:bg-zinc-900/50 opacity-60",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-zinc-500">
            {usersData?.total ?? 0} users total
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by username or user code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[250px]"
        />
        <Select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="h-8 w-[120px]"
        >
          <SelectOption value="">All Status</SelectOption>
          <SelectOption value="true">Active</SelectOption>
          <SelectOption value="false">Inactive</SelectOption>
        </Select>
        <Select
          value={filterAdmin}
          onChange={(e) => setFilterAdmin(e.target.value)}
          className="h-8 w-[120px]"
        >
          <SelectOption value="">All Roles</SelectOption>
          <SelectOption value="true">Admin</SelectOption>
          <SelectOption value="false">Non-Admin</SelectOption>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={usersData?.data ?? []}
        searchKey="username"
        searchPlaceholder="Filter by username..."
        isLoading={isLoading}
        emptyMessage="No users found."
        colorRules={colorRules}
        toolbarActions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      {/* Create User Dialog */}
      <FormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create User"
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="create-username">Username *</Label>
            <Input id="create-username" {...createForm.register("username")} />
            {createForm.formState.errors.username && (
              <p className="text-xs text-red-500">
                {createForm.formState.errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-userCode">User Code *</Label>
            <Input id="create-userCode" {...createForm.register("userCode")} />
            {createForm.formState.errors.userCode && (
              <p className="text-xs text-red-500">
                {createForm.formState.errors.userCode.message}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="create-password">Password *</Label>
          <Input
            id="create-password"
            type="password"
            {...createForm.register("password")}
          />
          {createForm.formState.errors.password && (
            <p className="text-xs text-red-500">
              {createForm.formState.errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="create-branchCode">Branch *</Label>
          <Select
            id="create-branchCode"
            {...createForm.register("branchCode")}
          >
            <SelectOption value="">Select Branch</SelectOption>
            {branches.map((b) => (
              <SelectOption key={b.id} value={b.branchCode}>
                {b.name} ({b.branchCode})
              </SelectOption>
            ))}
          </Select>
          {createForm.formState.errors.branchCode && (
            <p className="text-xs text-red-500">
              {createForm.formState.errors.branchCode.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...createForm.register("isAdmin")}
              className="rounded"
            />
            Admin
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...createForm.register("isActive")}
              className="rounded"
            />
            Active
          </label>
        </div>
      </FormDialog>

      {/* Edit User Dialog */}
      <FormDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingUser(null);
        }}
        title="Edit User"
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="edit-username">Username *</Label>
            <Input id="edit-username" {...editForm.register("username")} />
            {editForm.formState.errors.username && (
              <p className="text-xs text-red-500">
                {editForm.formState.errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-userCode">User Code *</Label>
            <Input id="edit-userCode" {...editForm.register("userCode")} />
            {editForm.formState.errors.userCode && (
              <p className="text-xs text-red-500">
                {editForm.formState.errors.userCode.message}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-branchCode">Branch *</Label>
          <Select id="edit-branchCode" {...editForm.register("branchCode")}>
            <SelectOption value="">Select Branch</SelectOption>
            {branches.map((b) => (
              <SelectOption key={b.id} value={b.branchCode}>
                {b.name} ({b.branchCode})
              </SelectOption>
            ))}
          </Select>
          {editForm.formState.errors.branchCode && (
            <p className="text-xs text-red-500">
              {editForm.formState.errors.branchCode.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...editForm.register("isAdmin")}
              className="rounded"
            />
            Admin
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...editForm.register("isActive")}
              className="rounded"
            />
            Active
          </label>
        </div>
      </FormDialog>

      {/* Change Password Dialog */}
      <FormDialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) {
            setPasswordUser(null);
            passwordForm.reset();
          }
        }}
        title={`Change Password${passwordUser ? ` - ${passwordUser.username}` : ""}`}
        onSubmit={handlePasswordSubmit}
        isSubmitting={changePasswordMutation.isPending}
        submitLabel="Change Password"
      >
        <div className="space-y-1">
          <Label htmlFor="new-password">New Password *</Label>
          <Input
            id="new-password"
            type="password"
            {...passwordForm.register("newPassword")}
          />
          {passwordForm.formState.errors.newPassword && (
            <p className="text-xs text-red-500">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirm-password">Confirm Password *</Label>
          <Input
            id="confirm-password"
            type="password"
            {...passwordForm.register("confirmPassword")}
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete user "${deletingUser?.username}" (${deletingUser?.userCode})? This action cannot be undone and will remove all associated permissions.`}
        confirmLabel="Delete User"
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
