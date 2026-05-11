'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LecturerAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendanceRecords()
  }, [])

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch('/api/attendance/history')
      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to fetch attendance records:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading attendance records...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-gray-600 mt-2">View attendance records for your assigned students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>
            Attendance records for students assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No attendance records found for your assigned students.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{record.student?.user?.name || 'Unknown Student'}</p>
                      <p className="text-sm text-gray-600">
                        Check-in: {new Date(record.checkInTime).toLocaleString()}
                      </p>
                      {record.checkOutTime && (
                        <p className="text-sm text-gray-600">
                          Check-out: {new Date(record.checkOutTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={record.status === 'ACTIVE' ? 'default' : record.status === 'COMPLETED' ? 'secondary' : 'destructive'}>
                      {record.status}
                    </Badge>
                    {record.hoursWorked && (
                      <span className="text-sm text-gray-600">
                        {record.hoursWorked.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
