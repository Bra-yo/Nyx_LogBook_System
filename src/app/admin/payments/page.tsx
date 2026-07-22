"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PendingMentee {
  id: string;
  name: string;
  email: string;
  registrationIdentifier?: string | null;
  paymentStatus: string;
  accountStatus: string;
  createdAt: string;
}

export default function PendingPaymentsPage() {
  const [mentees, setMentees] = useState<PendingMentee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/payments/pending");
      const data = await response.json();
      if (data.success) {
        setMentees(data.mentees || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleConfirmPayment = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${userId}/confirm`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to confirm payment");
      }
      toast.success("Payment confirmed successfully");
      fetchPendingPayments();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <DashboardLayout title="Pending Payments">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Review mentees awaiting payment confirmation before account activation.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading pending payments...</p>
            ) : mentees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mentees currently require payment confirmation.</p>
            ) : (
              <div className="space-y-3">
                {mentees.map((mentee) => (
                  <div key={mentee.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{mentee.name}</p>
                      <p className="text-sm text-muted-foreground">{mentee.email}</p>
                      {mentee.registrationIdentifier && (
                        <p className="text-sm text-muted-foreground">{mentee.registrationIdentifier}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{mentee.paymentStatus}</Badge>
                      <Badge variant="outline">{mentee.accountStatus}</Badge>
                      <Button size="sm" onClick={() => handleConfirmPayment(mentee.id)}>
                        Confirm Payment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
