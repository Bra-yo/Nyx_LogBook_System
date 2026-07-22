"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["STUDENT", "SUPERVISOR", "ADMIN"], {
    message: "Please select a valid role",
  }),
  phone: z.string().optional(),
  isActive: z.boolean(),
  registrationType: z.enum(["CAREER_MENTEE", "BUSINESS_MENTEE"]).optional(),
  mentorshipTrack: z.enum(["CAREER", "BUSINESS"]).optional(),
  cohortId: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string; code: string; status: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "STUDENT",
      isActive: true,
      registrationType: "CAREER_MENTEE",
      mentorshipTrack: "CAREER",
      cohortId: "",
    },
  });

  // Fetch departments on mount
  useEffect(() => {
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

    fetch("/api/admin/cohorts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCohorts(data.cohorts || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch cohorts:", err);
      });
  }, []);

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `User created successfully. Default password is ChangeMe123. The user will be required to change it after first login.`,
        );
        reset();
        router.push("/admin/users");
      } else {
        setError(result.error || "Failed to create user");
        toast.error(result.error || "Failed to create user");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
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
            <Label htmlFor="mentorshipTrack">Mentorship Track</Label>
            <Select
              value={watch("mentorshipTrack") || "CAREER"}
              onValueChange={(value) => setValue("mentorshipTrack", value as "CAREER" | "BUSINESS")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mentorship track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAREER">Career</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="cohortId">Cohort</Label>
            <Select
              value={watch("cohortId") || ""}
              onValueChange={(value) => setValue("cohortId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cohort" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name} ({cohort.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The mentee will be added to the selected cohort automatically.
            </p>
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
              automatically after the account is created.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new user to the system. They will receive a default password
              and be required to change it on first login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <CardFooter>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
