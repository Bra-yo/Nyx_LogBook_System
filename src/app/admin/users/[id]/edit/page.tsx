"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["STUDENT", "SUPERVISOR", "ADMIN"]),
  phone: z.string().optional(),
  isActive: z.boolean(),
  registrationType: z.enum(["CAREER_MENTEE", "BUSINESS_MENTEE"]).optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  // Fetch user data and departments on mount
  useEffect(() => {
    const userId = params.id as string;

    // Fetch user data
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          reset({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            phone: data.user.phone || "",
            isActive: data.user.isActive,
            registrationType: data.user.registrationIdentifier?.startsWith("BM-KE")
              ? "BUSINESS_MENTEE"
              : "CAREER_MENTEE",
          });
        } else {
          setError("User not found");
          toast.error("User not found");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user");
        toast.error("Failed to load user");
      });

    // Fetch departments
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDepartments(data.departments);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch departments:", err);
        toast.error("Failed to load departments");
      });
  }, [params.id, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("User updated successfully");
        router.push("/admin/users");
      } else {
        setError(result.error || "Failed to update user");
        toast.error(result.error || "Failed to update user");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (
      !confirm(
        "Are you sure you want to reset this user's password to the default? They will be required to change it on next login.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${params.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success(
          "Password reset successfully. User will need to change it on next login.",
        );
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  const renderRoleSpecificFields = () => {
    const role = watch("role");

    switch (role) {
      case "STUDENT":
        return (
          <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
            <Label htmlFor="registrationType">Registration Type</Label>
            <Select
              value={watch("registrationType") || "CAREER_MENTEE"}
              onValueChange={(value) =>
                setValue(
                  "registrationType",
                  value as "CAREER_MENTEE" | "BUSINESS_MENTEE",
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select registration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAREER_MENTEE">Career Mentee</SelectItem>
                <SelectItem value="BUSINESS_MENTEE">Business Mentee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case "SUPERVISOR":
        return (
          <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+254 700 000 000"
              {...register("phone")}
            />
            <p className="text-sm text-muted-foreground">
              Mentor registration will generate a registration identifier
              automatically after the account is updated.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
            <CardDescription>
              Update user information and manage account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {user?.registrationIdentifier && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-primary">
                    Registration Identifier
                  </p>
                  <p className="text-lg font-semibold">
                    {user.registrationIdentifier}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={watch("role")}
                    onValueChange={(value) => setValue("role", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Mentee</SelectItem>
                      <SelectItem value="SUPERVISOR">Mentor</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register("isActive")}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    Active user
                  </Label>
                </div>
              </div>

              {/* Role-specific fields */}
              {renderRoleSpecificFields()}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
              >
                Reset Password
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
              >
                Cancel
              </Button>
            </div>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
