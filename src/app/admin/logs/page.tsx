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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, filterAction]);

  const fetchLogs = async () => {
    try {
      // TODO: Implement actual API call
      // const params = new URLSearchParams({
      //   page: '1',
      //   limit: '100',
      //   ...(searchTerm && { search: searchTerm }),
      //   ...(filterAction !== 'all' && { action: filterAction })
      // })
      // const response = await fetch(`/api/admin/logs?${params}`)
      // if (response.ok) {
      //   const data = await response.json()
      //   setLogs(data.logs || [])
      // }

      // Mock data for now
      setLogs([
        {
          id: "1",
          userId: "user1",
          userName: "John Doe",
          action: "LOGIN",
          resource: "auth",
          details: "User logged in successfully",
          ipAddress: "192.168.1.1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          userId: "user2",
          userName: "Jane Smith",
          action: "CREATE",
          resource: "logbook_entry",
          details: "Created a new work record",
          resourceId: "entry123",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/admin/logs/export')
      // if (response.ok) {
      //   const blob = await response.blob()
      //   const url = window.URL.createObjectURL(blob)
      //   const a = document.createElement('a')
      //   a.href = url
      //   a.download = 'audit-logs.csv'
      //   a.click()
      // }

      console.log("Exporting logs...");
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "LOGIN":
        return "bg-green-100 text-green-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      case "CREATE":
        return "bg-blue-100 text-blue-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <DashboardLayout title="System Logs">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="System Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Logs</h2>
            <p className="text-muted-foreground">
              Monitor and audit system activities and user actions
            </p>
          </div>
          <Button onClick={exportLogs} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
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
                    placeholder="Search by user, action, or resource..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterAction === "all" ? "default" : "outline"}
                  onClick={() => setFilterAction("all")}
                >
                  All Actions
                </Button>
                <Button
                  variant={filterAction === "LOGIN" ? "default" : "outline"}
                  onClick={() => setFilterAction("LOGIN")}
                >
                  Login
                </Button>
                <Button
                  variant={filterAction === "CREATE" ? "default" : "outline"}
                  onClick={() => setFilterAction("CREATE")}
                >
                  Create
                </Button>
                <Button
                  variant={filterAction === "UPDATE" ? "default" : "outline"}
                  onClick={() => setFilterAction("UPDATE")}
                >
                  Update
                </Button>
                <Button
                  variant={filterAction === "DELETE" ? "default" : "outline"}
                  onClick={() => setFilterAction("DELETE")}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              {filteredLogs.length}{" "}
              {filteredLogs.length === 1 ? "work record" : "work records"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-600">
                        No audit logs found matching your criteria.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(
                            new Date(log.createdAt),
                            "MMM dd, yyyy HH:mm:ss",
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {log.userName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">
                In the last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logins</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter((l) => l.action === "LOGIN").length}
              </div>
              <p className="text-xs text-muted-foreground">
                User authentication
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creations</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter((l) => l.action === "CREATE").length}
              </div>
              <p className="text-xs text-muted-foreground">
                New resources created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
              <Activity className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter((l) => l.action === "UPDATE").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Resources modified
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
