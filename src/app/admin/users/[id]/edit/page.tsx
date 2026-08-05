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
  learningAreaId: z.string().trim().min(1, "Learning area is required for learner accounts").optional(),
  mentorCapacity: z.number().int().min(1).max(500).optional(),
  employmentType: z.string().optional(),
  maxActiveMentees: z.number().int().min(1).max(500).optional(),
  isAcceptingNewMentees: z.boolean().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

type EditUserResponse = {
  id: string;
  name: string;
  email: string;
  role: EditUserFormData["role"];
  phone?: string | null;
  isActive: boolean;
  registrationIdentifier?: string | null;
  studentProfile?: {
    learningAreaId?: string | null;
  } | null;
  supervisorProfile?: {
    maxActiveMentees?: number | null;
    isAcceptingNewMentees?: boolean | null;
    students?: Array<{ id: string }>;
  } | null;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<EditUserResponse | null>(null);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [learningAreas, setLearningAreas] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeMenteeCount, setActiveMenteeCount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "SUPERVISOR",
      phone: "",
      isActive: true,
      registrationType: "CAREER_MENTEE",
      mentorCapacity: 10,
      employmentType: "",
      maxActiveMentees: 10,
      isAcceptingNewMentees: true,
    },
  });

  const role = watch("role");

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
            learningAreaId: data.user.studentProfile?.learningAreaId || "",
            mentorCapacity:
              data.user.supervisorProfile?.mentorCapacity ?? 10,
            employmentType: data.user.supervisorProfile?.employmentType || "",
            maxActiveMentees:
              data.user.supervisorProfile?.maxActiveMentees ?? 10,
            isAcceptingNewMentees:
              data.user.supervisorProfile?.isAcceptingNewMentees ?? true,
          });
          setActiveMenteeCount(
            data.user.supervisorProfile?.students?.length ?? 0,
          );
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

    fetch("/api/admin/learning-areas")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLearningAreas(data.learningAreas || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch learning areas:", err);
        toast.error("Failed to load learning areas");
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

  const maxActiveMentees = watch("maxActiveMentees") ?? 10;
  const isAcceptingNewMentees = watch("isAcceptingNewMentees") ?? true;
  const availableSlots = Math.max(0, maxActiveMentees - activeMenteeCount);
  const hasCapacityWarning = activeMenteeCount > maxActiveMentees;

  const renderRoleSpecificFields = () => {
    switch (role) {
      case "STUDENT":
        return (
          <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
            <Label htmlFor="learningAreaId">Learning Area *</Label>
            <Select
              value={watch("learningAreaId") || ""}
              onValueChange={(value) => setValue("learningAreaId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a learning area" />
              </SelectTrigger>
              <SelectContent>
                {learningAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name} ({area.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.learningAreaId && (
              <p className="text-sm text-red-600">{errors.learningAreaId.message}</p>
            )}

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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="learningAreaId">Learning Area</Label>
                <Select
                  value={watch("learningAreaId") || ""}
                  onValueChange={(value) => setValue("learningAreaId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a learning area" />
                  </SelectTrigger>
                  <SelectContent>
                    {learningAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name} ({area.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mentorCapacity">Mentor capacity</Label>
                <Input
                  id="mentorCapacity"
                  type="number"
                  min="1"
                  max="500"
                  value={watch("mentorCapacity") ?? 10}
                  onChange={(event) => setValue("mentorCapacity", Number(event.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment type</Label>
                <Input
                  id="employmentType"
                  placeholder="Full-time, Part-time, Contract"
                  value={watch("employmentType") || ""}
                  onChange={(event) => setValue("employmentType", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxActiveMentees">Maximum active mentees</Label>
                <Input
                  id="maxActiveMentees"
                  type="number"
                  min="1"
                  max="500"
                  {...register("maxActiveMentees", { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-start justify-between rounded-lg border bg-background p-3 md:col-span-2">
                <div>
                  <Label htmlFor="isAcceptingNewMentees">Accepting new mentees</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle mentor availability for new allocations
                  </p>
                </div>
                <input
                  id="isAcceptingNewMentees"
                  type="checkbox"
                  checked={isAcceptingNewMentees}
                  onChange={(event) =>
                    setValue("isAcceptingNewMentees", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">Capacity overview</div>
              <div>Active mentees: {activeMenteeCount}</div>
              <div>Configured capacity: {maxActiveMentees}</div>
              <div>Available slots: {availableSlots}</div>
            </div>

            {hasCapacityWarning && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                This mentor currently has {activeMenteeCount} active mentees, which exceeds the new capacity of {maxActiveMentees}. Consider keeping the limit above the current count or informing the mentor before saving.
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Mentor onboarding will retain the server-generated registration identifier and the operational profile details you configure here.
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
                    onValueChange={(value) => setValue("role", value as EditUserFormData["role"])}
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
