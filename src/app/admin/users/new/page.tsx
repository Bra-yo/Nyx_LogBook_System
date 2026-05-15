'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['STUDENT', 'SUPERVISOR', 'LECTURER', 'ADMIN'], {
    message: 'Please select a valid role'
  }),
  departmentId: z.string().optional(),
  isActive: z.boolean(),
  // Role-specific fields
  regNumber: z.string().optional(),
  year: z.number().min(1, "Year must be at least 1").max(5, "Year must be at most 5").optional(),
  semester: z.number().min(1, "Semester must be at least 1").max(2, "Semester must be at most 2").optional(),
  course: z.string().optional(),
  institution: z.string().optional(),
  internshipCompany: z.string().optional(),
  internshipLocation: z.string().optional(),
  employeeId: z.string().optional(),
  organization: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  staffNumber: z.string().optional()
}).refine((data) => {
  // Department is required for STUDENT, SUPERVISOR, and LECTURER roles
  if (['STUDENT', 'SUPERVISOR', 'LECTURER'].includes(data.role)) {
    return data.departmentId && data.departmentId.length > 0
  }
  return true
}, {
  message: 'Department is required for this role',
  path: ['departmentId']
}).refine((data) => {
  // Year is required for STUDENT role
  if (data.role === 'STUDENT') {
    return data.year !== undefined && data.year !== null
  }
  return true
}, {
  message: 'Year is required for student profiles',
  path: ['year']
}).refine((data) => {
  // Registration number is required for STUDENT role
  if (data.role === 'STUDENT') {
    return data.regNumber && data.regNumber.length > 0
  }
  return true
}, {
  message: 'Registration number is required for student profiles',
  path: ['regNumber']
}).refine((data) => {
  // Internship company is required for STUDENT role
  if (data.role === 'STUDENT') {
    return data.internshipCompany && data.internshipCompany.length > 0
  }
  return true
}, {
  message: 'Internship company is required for student profiles',
  path: ['internshipCompany']
}).refine((data) => {
  // Company is required for SUPERVISOR role
  if (data.role === 'SUPERVISOR') {
    const company = data.company ?? data.organization
    return company !== undefined && company !== null && company.length > 0
  }
  return true
}, {
  message: 'Company is required for supervisor profiles',
  path: ['company']
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function NewUserPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([])
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'STUDENT',
      departmentId: '',
      isActive: true,
      regNumber: '',
      year: undefined,
      semester: undefined,
      course: '',
      institution: '',
      internshipCompany: '',
      internshipLocation: '',
      employeeId: '',
      organization: '',
      company: '',
      title: '',
      staffNumber: ''
    }
  })

  // Fetch departments on mount
  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDepartments(data.departments)
        }
      })
      .catch(err => {
        console.error('Failed to fetch departments:', err)
        toast.error('Failed to load departments')
      })
  }, [])

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`User created successfully. Default password is ChangeMe123. The user will be required to change it after first login.`)
        reset()
        router.push('/admin/users')
      } else {
        setError(result.error || 'Failed to create user')
        toast.error(result.error || 'Failed to create user')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      toast.error('Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  const renderRoleSpecificFields = () => {
    const role = watch('role')

    switch (role) {
      case 'STUDENT':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="regNumber">Registration Number</Label>
              <Input
                id="regNumber"
                placeholder="e.g., CS/2023/001"
                {...register('regNumber')}
              />
              {errors.regNumber && (
                <p className="text-sm text-red-600">{errors.regNumber.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Select value={watch('year')?.toString() || ''} onValueChange={(value) => setValue('year', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                    <SelectItem value="5">Year 5</SelectItem>
                  </SelectContent>
                </Select>
                {errors.year && (
                  <p className="text-sm text-red-600 mt-2">{errors.year.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select value={watch('semester')?.toString() || ''} onValueChange={(value) => setValue('semester', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
                {errors.semester && (
                  <p className="text-sm text-red-600 mt-2">{errors.semester.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                placeholder="e.g., Computer Science"
                {...register('course')}
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                placeholder="University name"
                {...register('institution')}
              />
            </div>
            <div>
              <Label htmlFor="internshipCompany">Internship Company *</Label>
              <Input
                id="internshipCompany"
                placeholder="Company name"
                {...register('internshipCompany')}
              />
              {errors.internshipCompany && (
                <p className="text-sm text-red-600">{errors.internshipCompany.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="internshipLocation">Internship Location</Label>
              <Input
                id="internshipLocation"
                placeholder="City, Country"
                {...register('internshipLocation')}
              />
            </div>
          </div>
        )
      
      case 'SUPERVISOR':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder="Staff number"
                {...register('employeeId')}
              />
            </div>
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="Company name"
                {...register('company')}
              />
              {errors.company && (
                <p className="text-sm text-red-600">{errors.company.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Job title"
                {...register('title')}
              />
            </div>
          </div>
        )
      
      case 'LECTURER':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="staffNumber">Staff Number</Label>
              <Input
                id="staffNumber"
                placeholder="Employee ID"
                {...register('staffNumber')}
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                placeholder="University name"
                {...register('institution')}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Job title"
                {...register('title')}
              />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new user to the system. They will receive a default password and be required to change it on first login.
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
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={watch('role')} onValueChange={(value) => setValue('role', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      <SelectItem value="LECTURER">Lecturer</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="departmentId">Department *</Label>
                  {departments.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-600">No departments found. Please create a department first.</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/admin/departments')}
                        className="w-full"
                      >
                        Create Department
                      </Button>
                    </div>
                  ) : (
                    <Select value={watch('departmentId') || ''} onValueChange={(value) => setValue('departmentId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.departmentId && (
                    <p className="text-sm text-red-600">{errors.departmentId.message}</p>
                  )}
                  {watch('role') === 'ADMIN' && (
                    <p className="text-xs text-gray-500 mt-2">Department is optional for admin users</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
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
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
