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
  learningAreaId: z.string().trim().min(1, "Learning area is required for learner accounts").optional(),
  mentorCapacity: z.coerce.number().int().min(1).max(500).optional(),
  employmentType: z.string().optional(),
  competencyIds: z.array(z.string()).optional(),
  competencyGroupIds: z.array(z.string()).optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string; code: string; status: string }>>([]);
  const [learningAreas, setLearningAreas] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [availableCompetencies, setAvailableCompetencies] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [availableCompetencyGroups, setAvailableCompetencyGroups] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isLoadingCompetencies, setIsLoadingCompetencies] = useState(false);
  const [isLoadingCompetencyGroups, setIsLoadingCompetencyGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "STUDENT",
      isActive: true,
      registrationType: "CAREER_MENTEE",
      mentorshipTrack: "CAREER",
      cohortId: "",
      learningAreaId: "",
      mentorCapacity: 10,
      employmentType: "",
      competencyIds: [],
      competencyGroupIds: [],
    },
  });

  const role = watch("role");
  const selectedLearningAreaId = watch("learningAreaId") || "";
  const selectedCompetencyIds = watch("competencyIds") || [];
  const selectedCompetencyGroupIds = watch("competencyGroupIds") || [];
  const selectedCompetencyIdsKey = Array.isArray(selectedCompetencyIds)
    ? selectedCompetencyIds.join("|")
    : String(selectedCompetencyIds);
  const selectedCompetencyGroupIdsKey = Array.isArray(selectedCompetencyGroupIds)
    ? selectedCompetencyGroupIds.join("|")
    : String(selectedCompetencyGroupIds);

  const areIdsEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => b[index] === value);

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
  }, []);

  useEffect(() => {
    const shouldClearCompetencies = role !== "SUPERVISOR" || !selectedLearningAreaId;
    if (shouldClearCompetencies) {
      setAvailableCompetencies([]);
      setAvailableCompetencyGroups([]);
      if (!areIdsEqual(selectedCompetencyIds as string[], [])) {
        setValue("competencyIds", []);
      }
      if (!areIdsEqual(selectedCompetencyGroupIds as string[], [])) {
        setValue("competencyGroupIds", []);
      }
      return;
    }

    let isMounted = true;
    setIsLoadingCompetencies(true);
    setError(null);

    fetch(`/api/admin/competencies?learningAreaId=${encodeURIComponent(selectedLearningAreaId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setAvailableCompetencies(data.competencies || []);
          setValue("competencyIds", []);
          setValue("competencyGroupIds", []);
        } else {
          setAvailableCompetencies([]);
          setError(data.error || "Failed to load competencies");
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailableCompetencies([]);
          setError("Failed to load competencies");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCompetencies(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [role, selectedLearningAreaId, setValue]);

  useEffect(() => {
    if (role !== "SUPERVISOR") {
      setAvailableCompetencyGroups([]);
      return;
    }

    const competencyIds = Array.isArray(selectedCompetencyIds) ? selectedCompetencyIds : [];
    if (competencyIds.length === 0) {
      setAvailableCompetencyGroups([]);
      if (!areIdsEqual(selectedCompetencyGroupIds as string[], [])) {
        setValue("competencyGroupIds", []);
      }
      return;
    }

    let isMounted = true;
    setIsLoadingCompetencyGroups(true);

    Promise.all(
      competencyIds.map((competencyId) =>
        fetch(`/api/admin/competency-groups?competencyId=${encodeURIComponent(competencyId)}`)
          .then((response) => response.json())
          .then((data) => (data.success ? data.competencyGroups || [] : [])),
      ),
    )
      .then((results) => {
        if (!isMounted) return;
        const groups = results.flat();
        const uniqueGroups = groups.filter(
          (group, index, array) => array.findIndex((item) => item.id === group.id) === index,
        );
        setAvailableCompetencyGroups(uniqueGroups);

        const validGroupIds = (selectedCompetencyGroupIds as string[]).filter((groupId) =>
          uniqueGroups.some((group) => group.id === groupId),
        );
        setValue("competencyGroupIds", validGroupIds);
      })
      .catch(() => {
        if (isMounted) {
          setAvailableCompetencyGroups([]);
          setError("Failed to load competency groups");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCompetencyGroups(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [role, selectedCompetencyIdsKey, selectedCompetencyGroupIdsKey, setValue]);

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    setError(null);

    if (data.role === "SUPERVISOR") {
      if (!data.learningAreaId) {
        setError("Please select a learning area for this mentor.");
        toast.error("Please select a learning area for this mentor.");
        setIsLoading(false);
        return;
      }

      if (!data.competencyGroupIds || data.competencyGroupIds.length === 0) {
        setError("Please select at least one competency group for this mentor.");
        toast.error("Please select at least one competency group for this mentor.");
        setIsLoading(false);
        return;
      }
    }

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
            <Label htmlFor="mentorCapacity">Mentor capacity</Label>
            <Input
              id="mentorCapacity"
              type="number"
              min="1"
              max="500"
              value={watch("mentorCapacity") ?? 10}
              onChange={(event) => setValue("mentorCapacity", Number(event.target.value))}
            />
            <Label htmlFor="employmentType">Employment type</Label>
            <Input
              id="employmentType"
              placeholder="Full-time, Part-time, Contract"
              value={watch("employmentType") || ""}
              onChange={(event) => setValue("employmentType", event.target.value)}
            />
            <Label htmlFor="competencyIds">Competencies</Label>
            <select
              id="competencyIds"
              multiple
              value={selectedCompetencyIds}
              onChange={(event) => {
                const nextValues = Array.from(event.target.selectedOptions, (option) => option.value);
                setValue("competencyIds", nextValues);
              }}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              {isLoadingCompetencies ? (
                <option disabled>Loading competencies...</option>
              ) : availableCompetencies.length === 0 ? (
                <option disabled>Select a learning area to load competencies</option>
              ) : (
                availableCompetencies.map((competency) => (
                  <option key={competency.id} value={competency.id}>
                    {competency.name}
                  </option>
                ))
              )}
            </select>
            <p className="text-sm text-muted-foreground">
              Choose one or more competencies for this mentor.
            </p>
            <Label htmlFor="competencyGroupIds">Competency Groups</Label>
            <select
              id="competencyGroupIds"
              multiple
              value={selectedCompetencyGroupIds}
              onChange={(event) => {
                const nextValues = Array.from(event.target.selectedOptions, (option) => option.value);
                setValue("competencyGroupIds", nextValues);
              }}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              {isLoadingCompetencyGroups ? (
                <option disabled>Loading competency groups...</option>
              ) : availableCompetencyGroups.length === 0 ? (
                <option disabled>Select competencies to load competency groups</option>
              ) : (
                availableCompetencyGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))
              )}
            </select>
            <p className="text-sm text-muted-foreground">
              A mentor must be assigned to one or more competency groups.
            </p>
            <p className="text-sm text-muted-foreground">
              Mentor onboarding will capture the operational details below and generate the registration identifier on the server after account creation.
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
                    onValueChange={(value) => setValue("role", value as CreateUserFormData["role"])}
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
