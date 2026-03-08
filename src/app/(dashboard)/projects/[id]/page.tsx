"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Send,
  MessageSquare,
  Users,
  FileText,
  Package,
  CalendarDays,
  LayoutDashboard,
  ListOrdered,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { StatusBadge } from "@/components/data-display/status-badge";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { FormDialog } from "@/components/forms/form-dialog";
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface ProjectDetail {
  id: number;
  serialNo: number;
  itemId: number | null;
  description: string;
  modelNo: string | null;
  location: string | null;
  quantity: number;
  rate: number;
  amount: number;
  fobPrice: number;
  landedCost: number;
  isFreeText: boolean;
}

interface ProjectRole {
  id: number;
  userId: number;
  roleCode: string;
  userRole: string;
  user?: { id: number; name: string; email: string };
}

interface ProjectRemark {
  id: number;
  remark: string;
  createdAt: string;
  createdBy: string | null;
  user?: { name: string } | null;
}

interface ProjectDocument {
  id: number;
  documentInfoId: number;
  targetDate: string | null;
  isSelected: boolean;
  uploadDate: string | null;
  destinationPath: string | null;
  documentInfo?: { id: number; name: string };
}

interface CumulativeLpo {
  id: number;
  modelNo: string;
  quantity: number;
  lpoDate: string | null;
  arrivalDate: string | null;
}

interface MaterialRequest {
  id: number;
  code: string;
  description: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface Project {
  id: number;
  projectNo: string;
  projectDate: string;
  projectName: string;
  description: string | null;
  status: string;
  customerId: number;
  totalAmount: number;
  discountPerc: number;
  discountAmount: number;
  netAmount: number;
  vatPerc: number;
  vatAmount: number;
  grossTotal: number;
  allowedAmount: number;
  remarks: string | null;
  projectTags: string | null;
  programDate: string | null;
  targetLpoDate: string | null;
  targetShipmentDate: string | null;
  deliverySiteDate: string | null;
  installationDate: string | null;
  commissionDate: string | null;
  handoverDate: string | null;
  customer?: { id: number; name: string; customerCode: string };
  projectManager?: { id: number; name: string } | null;
  teamLead?: { id: number; name: string } | null;
  details: ProjectDetail[];
  roles?: ProjectRole[];
  projectRemarks?: ProjectRemark[];
  documents?: ProjectDocument[];
  cumulativeLpoDates?: CumulativeLpo[];
}

interface UserLookup {
  id: number;
  name: string;
  email: string;
}

interface DocumentInfoLookup {
  id: number;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Status map ---

const projectStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  active: { label: "Active", variant: "default" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const mrStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
};

// --- Schemas ---

const editProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().optional().default(""),
  projectTags: z.string().optional().default(""),
  programDate: z.string().optional().default(""),
  targetLpoDate: z.string().optional().default(""),
  targetShipmentDate: z.string().optional().default(""),
  deliverySiteDate: z.string().optional().default(""),
  installationDate: z.string().optional().default(""),
  commissionDate: z.string().optional().default(""),
  handoverDate: z.string().optional().default(""),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

type TabId = "overview" | "items" | "team" | "documents" | "remarks" | "material-requests" | "lpo-tracking";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "items", label: "Line Items", icon: <ListOrdered className="h-4 w-4" /> },
  { id: "team", label: "Team", icon: <Users className="h-4 w-4" /> },
  { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
  { id: "remarks", label: "Remarks", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "material-requests", label: "Material Requests", icon: <Package className="h-4 w-4" /> },
  { id: "lpo-tracking", label: "LPO Tracking", icon: <CalendarDays className="h-4 w-4" /> },
];

// --- Component ---

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = Number(params.id);

  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [isEditing, setIsEditing] = React.useState(false);

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Team dialog
  const [teamDialogOpen, setTeamDialogOpen] = React.useState(false);
  const [teamRoleCode, setTeamRoleCode] = React.useState("");
  const [teamRoleDesc, setTeamRoleDesc] = React.useState("");
  const [teamUserId, setTeamUserId] = React.useState("");
  const [deleteRoleId, setDeleteRoleId] = React.useState<number | null>(null);

  // Document dialog
  const [docDialogOpen, setDocDialogOpen] = React.useState(false);
  const [docInfoId, setDocInfoId] = React.useState("");
  const [docTargetDate, setDocTargetDate] = React.useState("");
  const [docDestPath, setDocDestPath] = React.useState("");
  const [deleteDocId, setDeleteDocId] = React.useState<number | null>(null);

  // Remark state
  const [newRemark, setNewRemark] = React.useState("");
  const [editingRemarkId, setEditingRemarkId] = React.useState<number | null>(null);
  const [editingRemarkText, setEditingRemarkText] = React.useState("");
  const [deleteRemarkId, setDeleteRemarkId] = React.useState<number | null>(null);

  // LPO dialog
  const [lpoDialogOpen, setLpoDialogOpen] = React.useState(false);
  const [editingLpo, setEditingLpo] = React.useState<CumulativeLpo | null>(null);
  const [lpoModelNo, setLpoModelNo] = React.useState("");
  const [lpoQty, setLpoQty] = React.useState("1");
  const [lpoDate, setLpoDate] = React.useState("");
  const [lpoArrivalDate, setLpoArrivalDate] = React.useState("");
  const [deleteLpoId, setDeleteLpoId] = React.useState<number | null>(null);

  // Material request dialog
  const [mrDialogOpen, setMrDialogOpen] = React.useState(false);
  const [mrDescription, setMrDescription] = React.useState("");
  const [mrRemarks, setMrRemarks] = React.useState("");
  const [mrTargetLpoDate, setMrTargetLpoDate] = React.useState("");
  const [mrSupplierCode, setMrSupplierCode] = React.useState("");
  const [deleteMrId, setDeleteMrId] = React.useState<number | null>(null);
  const [approveMrId, setApproveMrId] = React.useState<number | null>(null);

  // --- Data fetching ---

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchApi<Project>(`/api/projects/${projectId}`),
    enabled: !!projectId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<UserLookup>>("/api/admin/users?pageSize=500").then((r) => r.data),
  });

  const { data: documentInfos = [] } = useQuery({
    queryKey: ["document-infos-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<DocumentInfoLookup>>("/api/setup/documents?pageSize=500").then((r) => r.data),
  });

  const { data: materialRequests = [] } = useQuery({
    queryKey: ["project-material-requests", projectId],
    queryFn: () =>
      fetchApi<PaginatedResponse<MaterialRequest>>(`/api/projects/${projectId}/material-requests?pageSize=500`).then((r) => r.data),
    enabled: !!projectId,
  });

  // --- Edit form ---

  const editForm = useForm<EditProjectFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editProjectSchema) as any,
    defaultValues: {
      projectName: "",
      description: "",
      projectTags: "",
      programDate: "",
      targetLpoDate: "",
      targetShipmentDate: "",
      deliverySiteDate: "",
      installationDate: "",
      commissionDate: "",
      handoverDate: "",
    },
  });

  React.useEffect(() => {
    if (project && isEditing) {
      editForm.reset({
        projectName: project.projectName,
        description: project.description ?? "",
        projectTags: project.projectTags ?? "",
        programDate: project.programDate?.split("T")[0] ?? "",
        targetLpoDate: project.targetLpoDate?.split("T")[0] ?? "",
        targetShipmentDate: project.targetShipmentDate?.split("T")[0] ?? "",
        deliverySiteDate: project.deliverySiteDate?.split("T")[0] ?? "",
        installationDate: project.installationDate?.split("T")[0] ?? "",
        commissionDate: project.commissionDate?.split("T")[0] ?? "",
        handoverDate: project.handoverDate?.split("T")[0] ?? "",
      });
    }
  }, [project, isEditing, editForm]);

  // --- Mutations ---

  const updateMutation = useMutation({
    mutationFn: (data: EditProjectFormData) =>
      fetchApi(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      setIsEditing(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchApi(`/api/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      router.push("/projects");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      fetchApi(`/api/projects/${projectId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Status updated");
      setStatusDialogOpen(false);
      setPendingStatus("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Team mutations
  const addRoleMutation = useMutation({
    mutationFn: (data: { userId: number; roleCode: string; userRole: string }) =>
      fetchApi(`/api/projects/${projectId}/roles`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Team member added");
      setTeamDialogOpen(false);
      setTeamRoleCode("");
      setTeamRoleDesc("");
      setTeamUserId("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) =>
      fetchApi(`/api/projects/${projectId}/roles/${roleId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Team member removed");
      setDeleteRoleId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Document mutations
  const addDocMutation = useMutation({
    mutationFn: (data: { documentInfoId: number; targetDate: string; destinationPath: string }) =>
      fetchApi(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Document added");
      setDocDialogOpen(false);
      setDocInfoId("");
      setDocTargetDate("");
      setDocDestPath("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleDocMutation = useMutation({
    mutationFn: ({ detailId, isSelected }: { detailId: number; isSelected: boolean }) =>
      fetchApi(`/api/projects/${projectId}/documents/${detailId}`, {
        method: "PUT",
        body: JSON.stringify({ isSelected }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (detailId: number) =>
      fetchApi(`/api/projects/${projectId}/documents/${detailId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Document removed");
      setDeleteDocId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Remark mutations
  const addRemarkMutation = useMutation({
    mutationFn: (remark: string) =>
      fetchApi(`/api/projects/${projectId}/remarks`, {
        method: "POST",
        body: JSON.stringify({ remark }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Remark added");
      setNewRemark("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRemarkMutation = useMutation({
    mutationFn: ({ remarkId, remark }: { remarkId: number; remark: string }) =>
      fetchApi(`/api/projects/${projectId}/remarks/${remarkId}`, {
        method: "PUT",
        body: JSON.stringify({ remark }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Remark updated");
      setEditingRemarkId(null);
      setEditingRemarkText("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRemarkMutation = useMutation({
    mutationFn: (remarkId: number) =>
      fetchApi(`/api/projects/${projectId}/remarks/${remarkId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Remark deleted");
      setDeleteRemarkId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // LPO mutations
  const saveLpoMutation = useMutation({
    mutationFn: (data: { id?: number; modelNo: string; quantity: number; lpoDate: string; arrivalDate: string }) => {
      if (data.id) {
        return fetchApi(`/api/projects/${projectId}/cumulative-lpo/${data.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      return fetchApi(`/api/projects/${projectId}/cumulative-lpo`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success(editingLpo ? "LPO updated" : "LPO added");
      setLpoDialogOpen(false);
      setEditingLpo(null);
      setLpoModelNo("");
      setLpoQty("1");
      setLpoDate("");
      setLpoArrivalDate("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteLpoMutation = useMutation({
    mutationFn: (lpoId: number) =>
      fetchApi(`/api/projects/${projectId}/cumulative-lpo/${lpoId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("LPO deleted");
      setDeleteLpoId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Material request mutations
  const createMrMutation = useMutation({
    mutationFn: (data: { description: string; remarks: string; targetLpoDate: string; supplierCode: string }) =>
      fetchApi(`/api/projects/${projectId}/material-requests`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-material-requests", projectId] });
      toast.success("Material request created");
      setMrDialogOpen(false);
      setMrDescription("");
      setMrRemarks("");
      setMrTargetLpoDate("");
      setMrSupplierCode("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMrMutation = useMutation({
    mutationFn: (mrId: number) =>
      fetchApi(`/api/material-requests/${mrId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-material-requests", projectId] });
      toast.success("Material request deleted");
      setDeleteMrId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approveMrMutation = useMutation({
    mutationFn: (mrId: number) =>
      fetchApi(`/api/material-requests/${mrId}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-material-requests", projectId] });
      toast.success("Material request approved");
      setApproveMrId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    editForm.handleSubmit((data) => {
      updateMutation.mutate(data);
    })(e);
  }

  function handleStatusChange(status: string) {
    setPendingStatus(status);
    setStatusDialogOpen(true);
  }

  function openLpoDialog(lpo?: CumulativeLpo) {
    if (lpo) {
      setEditingLpo(lpo);
      setLpoModelNo(lpo.modelNo);
      setLpoQty(String(lpo.quantity));
      setLpoDate(lpo.lpoDate?.split("T")[0] ?? "");
      setLpoArrivalDate(lpo.arrivalDate?.split("T")[0] ?? "");
    } else {
      setEditingLpo(null);
      setLpoModelNo("");
      setLpoQty("1");
      setLpoDate("");
      setLpoArrivalDate("");
    }
    setLpoDialogOpen(true);
  }

  function handleLpoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    saveLpoMutation.mutate({
      id: editingLpo?.id,
      modelNo: lpoModelNo,
      quantity: Number(lpoQty),
      lpoDate,
      arrivalDate: lpoArrivalDate,
    });
  }

  function handleTeamSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (teamUserId) {
      addRoleMutation.mutate({
        userId: Number(teamUserId),
        roleCode: teamRoleCode,
        userRole: teamRoleDesc,
      });
    }
  }

  function handleDocSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (docInfoId) {
      addDocMutation.mutate({
        documentInfoId: Number(docInfoId),
        targetDate: docTargetDate,
        destinationPath: docDestPath,
      });
    }
  }

  function handleMrSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createMrMutation.mutate({
      description: mrDescription,
      remarks: mrRemarks,
      targetLpoDate: mrTargetLpoDate,
      supplierCode: mrSupplierCode,
    });
  }

  // --- Helpers ---

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  }

  // --- Loading / Not found ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-zinc-500">Project not found</div>
        <Button variant="outline" onClick={() => router.push("/projects")}>
          Back to List
        </Button>
      </div>
    );
  }

  const isActive = project.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{project.projectNo}</h1>
              <StatusBadge status={project.status} statusMap={projectStatusMap} />
            </div>
            <p className="text-sm text-zinc-500">
              {project.customer?.name} | {project.projectName} | {formatDate(project.projectDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && activeTab === "overview" && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {isActive && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange("COMPLETED")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange("ON_HOLD")}>
                On Hold
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleStatusChange("CANCELLED")}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          project={project}
          isEditing={isEditing}
          editForm={editForm}
          onSubmitEdit={handleEditSubmit}
          onCancelEdit={() => setIsEditing(false)}
          isUpdating={updateMutation.isPending}
          formatDate={formatDate}
        />
      )}

      {activeTab === "items" && <LineItemsTab project={project} />}

      {activeTab === "team" && (
        <TeamTab
          project={project}
          onAddMember={() => setTeamDialogOpen(true)}
          onDeleteMember={(id) => setDeleteRoleId(id)}
        />
      )}

      {activeTab === "documents" && (
        <DocumentsTab
          project={project}
          onAddDoc={() => setDocDialogOpen(true)}
          onToggleDoc={(detailId, isSelected) => toggleDocMutation.mutate({ detailId, isSelected })}
          onDeleteDoc={(id) => setDeleteDocId(id)}
        />
      )}

      {activeTab === "remarks" && (
        <RemarksTab
          project={project}
          newRemark={newRemark}
          setNewRemark={setNewRemark}
          onAddRemark={() => {
            if (newRemark.trim()) addRemarkMutation.mutate(newRemark.trim());
          }}
          isAddingRemark={addRemarkMutation.isPending}
          editingRemarkId={editingRemarkId}
          editingRemarkText={editingRemarkText}
          onStartEditRemark={(id, text) => {
            setEditingRemarkId(id);
            setEditingRemarkText(text);
          }}
          onSaveEditRemark={() => {
            if (editingRemarkId !== null) {
              updateRemarkMutation.mutate({ remarkId: editingRemarkId, remark: editingRemarkText });
            }
          }}
          onCancelEditRemark={() => {
            setEditingRemarkId(null);
            setEditingRemarkText("");
          }}
          setEditingRemarkText={setEditingRemarkText}
          isUpdatingRemark={updateRemarkMutation.isPending}
          onDeleteRemark={(id) => setDeleteRemarkId(id)}
          formatDate={formatDate}
        />
      )}

      {activeTab === "material-requests" && (
        <MaterialRequestsTab
          materialRequests={materialRequests}
          onNewMr={() => setMrDialogOpen(true)}
          onDeleteMr={(id) => setDeleteMrId(id)}
          onApproveMr={(id) => setApproveMrId(id)}
          onViewMr={(id) => router.push(`/projects/${projectId}/material-requests/${id}`)}
        />
      )}

      {activeTab === "lpo-tracking" && (
        <LpoTrackingTab
          project={project}
          onAddLpo={() => openLpoDialog()}
          onEditLpo={(lpo) => openLpoDialog(lpo)}
          onDeleteLpo={(id) => setDeleteLpoId(id)}
          formatDate={formatDate}
        />
      )}

      {/* --- All Dialogs --- */}

      {/* Status change */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title="Change Project Status"
        description={`Change status of "${project.projectNo}" to ${pendingStatus}?`}
        confirmLabel="Change Status"
        onConfirm={() => statusMutation.mutate(pendingStatus)}
        isLoading={statusMutation.isPending}
        variant={pendingStatus === "CANCELLED" ? "destructive" : "default"}
      />

      {/* Delete project */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.projectNo}"? This cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />

      {/* Team member dialog */}
      <FormDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        title="Add Team Member"
        onSubmit={handleTeamSubmit}
        isSubmitting={addRoleMutation.isPending}
      >
        <div className="space-y-1">
          <Label>User</Label>
          <Select value={teamUserId} onChange={(e) => setTeamUserId(e.target.value)}>
            <SelectOption value="">Select User</SelectOption>
            {users.map((u) => (
              <SelectOption key={u.id} value={String(u.id)}>
                {u.name}
              </SelectOption>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Role Code</Label>
          <Input value={teamRoleCode} onChange={(e) => setTeamRoleCode(e.target.value)} placeholder="e.g. PM, TL, ENG" />
        </div>
        <div className="space-y-1">
          <Label>Role Description</Label>
          <Input value={teamRoleDesc} onChange={(e) => setTeamRoleDesc(e.target.value)} placeholder="e.g. Project Manager" />
        </div>
      </FormDialog>

      {/* Delete role */}
      <ConfirmDialog
        open={deleteRoleId !== null}
        onOpenChange={(open) => { if (!open) setDeleteRoleId(null); }}
        title="Remove Team Member"
        description="Are you sure you want to remove this team member?"
        onConfirm={() => deleteRoleId !== null && deleteRoleMutation.mutate(deleteRoleId)}
        isLoading={deleteRoleMutation.isPending}
      />

      {/* Document dialog */}
      <FormDialog
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
        title="Add Document"
        onSubmit={handleDocSubmit}
        isSubmitting={addDocMutation.isPending}
      >
        <div className="space-y-1">
          <Label>Document Type</Label>
          <Select value={docInfoId} onChange={(e) => setDocInfoId(e.target.value)}>
            <SelectOption value="">Select Document</SelectOption>
            {documentInfos.map((d) => (
              <SelectOption key={d.id} value={String(d.id)}>
                {d.name}
              </SelectOption>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Target Date</Label>
          <Input type="date" value={docTargetDate} onChange={(e) => setDocTargetDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Destination Path</Label>
          <Input value={docDestPath} onChange={(e) => setDocDestPath(e.target.value)} placeholder="Path or URL" />
        </div>
      </FormDialog>

      {/* Delete document */}
      <ConfirmDialog
        open={deleteDocId !== null}
        onOpenChange={(open) => { if (!open) setDeleteDocId(null); }}
        title="Remove Document"
        description="Are you sure you want to remove this document?"
        onConfirm={() => deleteDocId !== null && deleteDocMutation.mutate(deleteDocId)}
        isLoading={deleteDocMutation.isPending}
      />

      {/* Delete remark */}
      <ConfirmDialog
        open={deleteRemarkId !== null}
        onOpenChange={(open) => { if (!open) setDeleteRemarkId(null); }}
        title="Delete Remark"
        description="Are you sure you want to delete this remark?"
        onConfirm={() => deleteRemarkId !== null && deleteRemarkMutation.mutate(deleteRemarkId)}
        isLoading={deleteRemarkMutation.isPending}
      />

      {/* LPO dialog */}
      <FormDialog
        open={lpoDialogOpen}
        onOpenChange={setLpoDialogOpen}
        title={editingLpo ? "Edit LPO Entry" : "Add LPO Entry"}
        onSubmit={handleLpoSubmit}
        isSubmitting={saveLpoMutation.isPending}
      >
        <div className="space-y-1">
          <Label>Model No</Label>
          <Input value={lpoModelNo} onChange={(e) => setLpoModelNo(e.target.value)} placeholder="Model number" />
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input type="number" min="1" value={lpoQty} onChange={(e) => setLpoQty(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>LPO Date</Label>
          <Input type="date" value={lpoDate} onChange={(e) => setLpoDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Arrival Date</Label>
          <Input type="date" value={lpoArrivalDate} onChange={(e) => setLpoArrivalDate(e.target.value)} />
        </div>
      </FormDialog>

      {/* Delete LPO */}
      <ConfirmDialog
        open={deleteLpoId !== null}
        onOpenChange={(open) => { if (!open) setDeleteLpoId(null); }}
        title="Delete LPO Entry"
        description="Are you sure you want to delete this LPO entry?"
        onConfirm={() => deleteLpoId !== null && deleteLpoMutation.mutate(deleteLpoId)}
        isLoading={deleteLpoMutation.isPending}
      />

      {/* Material Request dialog */}
      <FormDialog
        open={mrDialogOpen}
        onOpenChange={setMrDialogOpen}
        title="New Material Request"
        onSubmit={handleMrSubmit}
        isSubmitting={createMrMutation.isPending}
      >
        <div className="space-y-1">
          <Label>Description</Label>
          <Input value={mrDescription} onChange={(e) => setMrDescription(e.target.value)} placeholder="Description" />
        </div>
        <div className="space-y-1">
          <Label>Remarks</Label>
          <textarea
            className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700"
            rows={2}
            value={mrRemarks}
            onChange={(e) => setMrRemarks(e.target.value)}
            placeholder="Remarks..."
          />
        </div>
        <div className="space-y-1">
          <Label>Target LPO Date</Label>
          <Input type="date" value={mrTargetLpoDate} onChange={(e) => setMrTargetLpoDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Supplier Code</Label>
          <Input value={mrSupplierCode} onChange={(e) => setMrSupplierCode(e.target.value)} placeholder="Supplier code" />
        </div>
      </FormDialog>

      {/* Delete MR */}
      <ConfirmDialog
        open={deleteMrId !== null}
        onOpenChange={(open) => { if (!open) setDeleteMrId(null); }}
        title="Delete Material Request"
        description="Are you sure you want to delete this material request?"
        onConfirm={() => deleteMrId !== null && deleteMrMutation.mutate(deleteMrId)}
        isLoading={deleteMrMutation.isPending}
      />

      {/* Approve MR */}
      <ConfirmDialog
        open={approveMrId !== null}
        onOpenChange={(open) => { if (!open) setApproveMrId(null); }}
        title="Approve Material Request"
        description="Are you sure you want to approve this material request?"
        confirmLabel="Approve"
        onConfirm={() => approveMrId !== null && approveMrMutation.mutate(approveMrId)}
        isLoading={approveMrMutation.isPending}
        variant="default"
      />
    </div>
  );
}

// ============================
// Tab Components
// ============================

// --- Overview Tab ---

function OverviewTab({
  project,
  isEditing,
  editForm,
  onSubmitEdit,
  onCancelEdit,
  isUpdating,
  formatDate,
}: {
  project: Project;
  isEditing: boolean;
  editForm: ReturnType<typeof useForm<EditProjectFormData>>;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  isUpdating: boolean;
  formatDate: (d: string | null | undefined) => string;
}) {
  if (isEditing) {
    return (
      <form onSubmit={onSubmitEdit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Edit Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Project Name *</Label>
                <Input {...editForm.register("projectName")} />
                {editForm.formState.errors.projectName && (
                  <p className="text-xs text-red-500">{editForm.formState.errors.projectName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input {...editForm.register("description")} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Tags (comma-separated)</Label>
                <Input {...editForm.register("projectTags")} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Timeline Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Program Date</Label>
                <Input type="date" {...editForm.register("programDate")} />
              </div>
              <div className="space-y-1">
                <Label>Target LPO Date</Label>
                <Input type="date" {...editForm.register("targetLpoDate")} />
              </div>
              <div className="space-y-1">
                <Label>Target Shipment Date</Label>
                <Input type="date" {...editForm.register("targetShipmentDate")} />
              </div>
              <div className="space-y-1">
                <Label>Delivery Site Date</Label>
                <Input type="date" {...editForm.register("deliverySiteDate")} />
              </div>
              <div className="space-y-1">
                <Label>Installation Date</Label>
                <Input type="date" {...editForm.register("installationDate")} />
              </div>
              <div className="space-y-1">
                <Label>Commission Date</Label>
                <Input type="date" {...editForm.register("commissionDate")} />
              </div>
              <div className="space-y-1">
                <Label>Handover Date</Label>
                <Input type="date" {...editForm.register("handoverDate")} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    );
  }

  const timelineDates = [
    { label: "Program Date", value: project.programDate },
    { label: "Target LPO Date", value: project.targetLpoDate },
    { label: "Target Shipment Date", value: project.targetShipmentDate },
    { label: "Delivery Site Date", value: project.deliverySiteDate },
    { label: "Installation Date", value: project.installationDate },
    { label: "Commission Date", value: project.commissionDate },
    { label: "Handover Date", value: project.handoverDate },
  ];

  return (
    <div className="space-y-6">
      {/* Project info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Customer</div>
              <div className="font-medium">{project.customer?.name ?? "-"}</div>
              {project.customer?.customerCode && (
                <div className="text-xs text-zinc-400">{project.customer.customerCode}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Project Name</div>
              <div className="font-medium">{project.projectName}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Date</div>
              <div className="font-medium">{formatDate(project.projectDate)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Description</div>
              <div className="font-medium">{project.description ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Project Manager</div>
              <div className="font-medium">{project.projectManager?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Team Lead</div>
              <div className="font-medium">{project.teamLead?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {project.projectTags
                  ? project.projectTags.split(",").map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {tag.trim()}
                      </Badge>
                    ))
                  : <span className="text-sm text-zinc-400">-</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Dates */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {timelineDates.map((td) => (
              <div key={td.label} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3">
                <div className="text-xs text-zinc-500 mb-1">{td.label}</div>
                <div className="font-medium text-sm">{formatDate(td.value)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <div className="flex justify-end">
        <Card className="w-[400px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Amount</span>
              <CurrencyDisplay amount={Number(project.totalAmount)} />
            </div>
            {Number(project.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Discount ({Number(project.discountPerc)}%)</span>
                <span>-<CurrencyDisplay amount={Number(project.discountAmount)} /></span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Net Amount</span>
              <CurrencyDisplay amount={Number(project.netAmount)} />
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT ({Number(project.vatPerc)}%)</span>
              <CurrencyDisplay amount={Number(project.vatAmount)} />
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Gross Total</span>
              <CurrencyDisplay amount={Number(project.grossTotal)} className="text-lg font-bold" />
            </div>
            {Number(project.allowedAmount) > 0 && (
              <div className="flex justify-between text-sm border-t pt-2 text-blue-600">
                <span>Allowed Amount</span>
                <CurrencyDisplay amount={Number(project.allowedAmount)} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Line Items Tab ---

function LineItemsTab({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Line Items ({project.details.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <th className="text-left p-2 w-10">S/No</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2 w-[120px]">Model</th>
                <th className="text-left p-2 w-[100px]">Location</th>
                <th className="text-right p-2 w-[80px]">Qty</th>
                <th className="text-right p-2 w-[110px]">Rate</th>
                <th className="text-right p-2 w-[120px]">Amount</th>
                <th className="text-right p-2 w-[110px]">FOB</th>
                <th className="text-right p-2 w-[110px]">Landed Cost</th>
              </tr>
            </thead>
            <tbody>
              {project.details.map((detail) => (
                <tr key={detail.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="p-2 text-zinc-400">{detail.serialNo}</td>
                  <td className="p-2">
                    <div>{detail.description}</div>
                    {detail.isFreeText && (
                      <Badge variant="secondary" className="text-[10px] mt-1">Free Text</Badge>
                    )}
                  </td>
                  <td className="p-2 text-zinc-600">{detail.modelNo ?? "-"}</td>
                  <td className="p-2 text-zinc-600">{detail.location ?? "-"}</td>
                  <td className="p-2 text-right">{Number(detail.quantity)}</td>
                  <td className="p-2 text-right">
                    <CurrencyDisplay amount={Number(detail.rate)} className="text-xs" />
                  </td>
                  <td className="p-2 text-right">
                    <CurrencyDisplay amount={Number(detail.amount)} className="text-xs" />
                  </td>
                  <td className="p-2 text-right">
                    <CurrencyDisplay amount={Number(detail.fobPrice)} className="text-xs" />
                  </td>
                  <td className="p-2 text-right">
                    <CurrencyDisplay amount={Number(detail.landedCost)} className="text-xs" />
                  </td>
                </tr>
              ))}
              {project.details.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    No line items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Team Tab ---

function TeamTab({
  project,
  onAddMember,
  onDeleteMember,
}: {
  project: Project;
  onAddMember: () => void;
  onDeleteMember: (id: number) => void;
}) {
  const roles = project.roles ?? [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Team Members ({roles.length})</CardTitle>
          <Button size="sm" onClick={onAddMember}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {roles.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
            No team members assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2 w-[120px]">Role Code</th>
                  <th className="text-left p-2">Role Description</th>
                  <th className="text-center p-2 w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="p-2 font-medium">{role.user?.name ?? "-"}</td>
                    <td className="p-2">
                      <Badge variant="secondary">{role.roleCode}</Badge>
                    </td>
                    <td className="p-2 text-zinc-600">{role.userRole}</td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDeleteMember(role.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Documents Tab ---

function DocumentsTab({
  project,
  onAddDoc,
  onToggleDoc,
  onDeleteDoc,
}: {
  project: Project;
  onAddDoc: () => void;
  onToggleDoc: (detailId: number, isSelected: boolean) => void;
  onDeleteDoc: (id: number) => void;
}) {
  const docs = project.documents ?? [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Documents ({docs.length})</CardTitle>
          <Button size="sm" onClick={onAddDoc}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
            No documents added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-center p-2 w-[60px]">Status</th>
                  <th className="text-left p-2">Document</th>
                  <th className="text-left p-2 w-[120px]">Target Date</th>
                  <th className="text-left p-2 w-[120px]">Upload Date</th>
                  <th className="text-left p-2">Path</th>
                  <th className="text-center p-2 w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={doc.isSelected}
                        onChange={(e) => onToggleDoc(doc.id, e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                      />
                    </td>
                    <td className="p-2 font-medium">{doc.documentInfo?.name ?? "-"}</td>
                    <td className="p-2 text-zinc-600">{doc.targetDate ? format(new Date(doc.targetDate), "dd/MM/yyyy") : "-"}</td>
                    <td className="p-2 text-zinc-600">{doc.uploadDate ? format(new Date(doc.uploadDate), "dd/MM/yyyy") : "-"}</td>
                    <td className="p-2 text-zinc-600 text-xs truncate max-w-[200px]">{doc.destinationPath ?? "-"}</td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDeleteDoc(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Remarks Tab ---

function RemarksTab({
  project,
  newRemark,
  setNewRemark,
  onAddRemark,
  isAddingRemark,
  editingRemarkId,
  editingRemarkText,
  onStartEditRemark,
  onSaveEditRemark,
  onCancelEditRemark,
  setEditingRemarkText,
  isUpdatingRemark,
  onDeleteRemark,
  formatDate,
}: {
  project: Project;
  newRemark: string;
  setNewRemark: (v: string) => void;
  onAddRemark: () => void;
  isAddingRemark: boolean;
  editingRemarkId: number | null;
  editingRemarkText: string;
  onStartEditRemark: (id: number, text: string) => void;
  onSaveEditRemark: () => void;
  onCancelEditRemark: () => void;
  setEditingRemarkText: (v: string) => void;
  isUpdatingRemark: boolean;
  onDeleteRemark: (id: number) => void;
  formatDate: (d: string | null | undefined) => string;
}) {
  const remarks = project.projectRemarks ?? [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Remarks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {remarks.length > 0 ? (
          <div className="space-y-3">
            {remarks.map((remark) => (
              <div key={remark.id} className="border rounded-md p-3">
                {editingRemarkId === remark.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700"
                      rows={2}
                      value={editingRemarkText}
                      onChange={(e) => setEditingRemarkText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={onSaveEditRemark}
                        disabled={isUpdatingRemark}
                      >
                        {isUpdatingRemark ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={onCancelEditRemark}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm">{remark.remark}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {remark.user?.name ?? remark.createdBy ?? "System"} - {formatDate(remark.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onStartEditRemark(remark.id, remark.remark)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDeleteRemark(remark.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No remarks yet.</p>
        )}

        {/* Add Remark */}
        <div className="flex gap-2 pt-2 border-t">
          <textarea
            className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700"
            rows={2}
            placeholder="Add a remark..."
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
          />
          <Button
            onClick={onAddRemark}
            disabled={!newRemark.trim() || isAddingRemark}
            className="self-end"
          >
            <Send className="mr-2 h-4 w-4" />
            {isAddingRemark ? "Adding..." : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Material Requests Tab ---

function MaterialRequestsTab({
  materialRequests,
  onNewMr,
  onDeleteMr,
  onApproveMr,
  onViewMr,
}: {
  materialRequests: MaterialRequest[];
  onNewMr: () => void;
  onDeleteMr: (id: number) => void;
  onApproveMr: (id: number) => void;
  onViewMr: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Material Requests ({materialRequests.length})</CardTitle>
          <Button size="sm" onClick={onNewMr}>
            <Plus className="mr-2 h-4 w-4" />
            New Material Request
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {materialRequests.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
            No material requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2 w-[120px]">Status</th>
                  <th className="text-right p-2 w-[120px]">Total</th>
                  <th className="text-center p-2 w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materialRequests.map((mr) => (
                  <tr key={mr.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="p-2 font-medium">{mr.code}</td>
                    <td className="p-2 text-zinc-600">{mr.description ?? "-"}</td>
                    <td className="p-2">
                      <StatusBadge status={mr.status} statusMap={mrStatusMap} />
                    </td>
                    <td className="p-2 text-right">
                      <CurrencyDisplay amount={Number(mr.totalAmount)} className="text-xs" />
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View"
                          onClick={() => onViewMr(mr.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {mr.status === "DRAFT" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Approve"
                              onClick={() => onApproveMr(mr.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Delete"
                              onClick={() => onDeleteMr(mr.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- LPO Tracking Tab ---

function LpoTrackingTab({
  project,
  onAddLpo,
  onEditLpo,
  onDeleteLpo,
  formatDate,
}: {
  project: Project;
  onAddLpo: () => void;
  onEditLpo: (lpo: CumulativeLpo) => void;
  onDeleteLpo: (id: number) => void;
  formatDate: (d: string | null | undefined) => string;
}) {
  const lpos = project.cumulativeLpoDates ?? [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Cumulative LPO Dates ({lpos.length})</CardTitle>
          <Button size="sm" onClick={onAddLpo}>
            <Plus className="mr-2 h-4 w-4" />
            Add LPO Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lpos.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
            No LPO entries yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left p-2">Model No</th>
                  <th className="text-right p-2 w-[100px]">Quantity</th>
                  <th className="text-left p-2 w-[120px]">LPO Date</th>
                  <th className="text-left p-2 w-[120px]">Arrival Date</th>
                  <th className="text-center p-2 w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lpos.map((lpo) => (
                  <tr key={lpo.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="p-2 font-medium">{lpo.modelNo}</td>
                    <td className="p-2 text-right">{lpo.quantity}</td>
                    <td className="p-2 text-zinc-600">{formatDate(lpo.lpoDate)}</td>
                    <td className="p-2 text-zinc-600">{formatDate(lpo.arrivalDate)}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit"
                          onClick={() => onEditLpo(lpo)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Delete"
                          onClick={() => onDeleteLpo(lpo.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
