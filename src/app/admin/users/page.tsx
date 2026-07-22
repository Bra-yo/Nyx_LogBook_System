"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  registrationIdentifier?: string | null;
  lastLogin?: string;
  studentProfile?: {
    department: { name: string };
    regNumber: string;
  };
  supervisorProfile?: {
    department: { name: string };
  };
  lecturerProfile?: {
    department: { name: string };
  };
  adminProfile?: {
    department: { name: string };
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const roleColors = {
  [UserRole.STUDENT]: "bg-blue-100 text-blue-800",
  [UserRole.SUPERVISOR]: "bg-green-100 text-green-800",
  [UserRole.LECTURER]: "bg-purple-100 text-purple-800",
  [UserRole.ADMIN]: "bg-red-100 text-red-800",
  [UserRole.WORKER]: "bg-amber-100 text-amber-800",
};

const roleLabels = {
  [UserRole.STUDENT]: "Student",
  [UserRole.SUPERVISOR]: "Supervisor",
  [UserRole.LECTURER]: "Lecturer",
  [UserRole.ADMIN]: "Administrator",
  [UserRole.WORKER]: "Worker",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [syncingWorkers, setSyncingWorkers] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    created: number;
    updated: number;
    inactive: number;
    skipped: number;
    errors: number;
    lastSync: string | null;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "100", // Get all users for client-side filtering
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== "all" && { role: filterRole }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDepartmentName(user).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getDepartmentName = (user: User): string => {
    if (user.studentProfile?.department)
      return user.studentProfile.department.name;
    if (user.supervisorProfile?.department)
      return user.supervisorProfile.department.name;
    if (user.lecturerProfile?.department)
      return user.lecturerProfile.department.name;
    if (user.adminProfile?.department) return user.adminProfile.department.name;
    return "No Department";
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Unable to update user status.");
      }

      toast.success(
        `User has been ${currentStatus ? "deactivated" : "activated"}.`,
      );
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error((error as Error).message || "Failed to update user status.");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    const confirmed = window.confirm(
      "This action will deactivate the user account while preserving profile data. Continue?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${userId}?action=deactivate`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Unable to deactivate user.");
      }

      toast.success("User has been deactivated successfully.");
      fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error((error as Error).message || "Failed to deactivate user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      "This action will permanently remove the user and related records from the system. Continue?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${userId}?action=permanent`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Unable to delete user permanently.",
        );
      }

      toast.success("User has been deleted permanently.");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user permanently:", error);
      toast.error(
        (error as Error).message || "Failed to delete user permanently.",
      );
    }
  };

  const handleSyncWorkers = async () => {
    try {
      setSyncingWorkers(true);
      const response = await fetch("/api/admin/workers/sync", {
        method: "POST",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to synchronize workers.");
      }

      setSyncSummary({
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        inactive: data.inactive ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors ?? 0,
        lastSync: data.lastSync ?? null,
      });

      toast.success("Worker synchronization completed.");
      fetchUsers();
    } catch (error) {
      console.error("Error synchronizing workers:", error);
      toast.error((error as Error).message || "Failed to synchronize workers.");
    } finally {
      setSyncingWorkers(false);
    }
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">
              Manage system users and their roles
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSyncWorkers}
              disabled={syncingWorkers}
            >
              {syncingWorkers ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {syncingWorkers ? "Syncing..." : "Synchronize Workers"}
            </Button>
            <Link href="/admin/users/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </Link>
          </div>
        </div>

        {syncSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Last Synchronization</CardTitle>
              <CardDescription>
                {syncSummary.lastSync
                  ? `Completed ${new Date(syncSummary.lastSync).toLocaleString()}`
                  : "No sync has completed yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-6">
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-xl font-semibold">
                    {syncSummary.created}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Updated</div>
                  <div className="text-xl font-semibold">
                    {syncSummary.updated}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Inactive</div>
                  <div className="text-xl font-semibold">
                    {syncSummary.inactive}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Skipped</div>
                  <div className="text-xl font-semibold">
                    {syncSummary.skipped}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Errors</div>
                  <div className="text-xl font-semibold">
                    {syncSummary.errors}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Last Sync</div>
                  <div className="text-xl font-semibold">
                    {syncSummary.lastSync ? "Completed" : "Pending"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : users.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <div className="h-4 w-4 rounded-full bg-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading
                  ? "..."
                  : users.filter((u) => u.role === UserRole.STUDENT).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading
                  ? "..."
                  : users.filter((u) => u.role === UserRole.SUPERVISOR).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
              <div className="h-4 w-4 rounded-full bg-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {loading
                  ? "..."
                  : users.filter((u) => u.role === UserRole.LECTURER).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <div className="h-4 w-4 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading
                  ? "..."
                  : users.filter((u) => u.role === UserRole.ADMIN).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workers</CardTitle>
              <div className="h-4 w-4 rounded-full bg-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loading
                  ? "..."
                  : users.filter((u) => u.role === UserRole.WORKER).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    {filterRole === "all"
                      ? "All Roles"
                      : roleLabels[filterRole]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterRole("all")}>
                    All Roles
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setFilterRole(UserRole.STUDENT)}
                  >
                    Students
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterRole(UserRole.SUPERVISOR)}
                  >
                    Supervisors
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterRole(UserRole.LECTURER)}
                  >
                    Lecturers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterRole(UserRole.ADMIN)}
                  >
                    Administrators
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterRole(UserRole.WORKER)}
                  >
                    Workers
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {filterStatus === "all"
                      ? "All Status"
                      : filterStatus === "active"
                        ? "Active"
                        : "Inactive"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              {loading
                ? "Loading..."
                : `${filteredUsers.length} ${filteredUsers.length === 1 ? "user" : "users"} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="text-xs font-medium text-primary">
                            {user.registrationIdentifier || "No identifier assigned"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{getDepartmentName(user)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              user.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-sm">
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLogin
                            ? formatDate(user.lastLogin)
                            : "Never"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="z-100 border border-border bg-popover text-popover-foreground shadow-lg"
                          >
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(user.id, user.isActive)
                              }
                            >
                              {user.isActive ? (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
