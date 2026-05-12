import { LogStatus } from '@/types'

interface LogbookEntryWithComments {
  status: LogStatus
  comments?: Array<{
    status: string
    createdAt: string
  }>
  assessments?: {
    status: string
    assessedAt?: string
  }
}

/**
 * Get the display status for a logbook entry based on supervisor comments and assessments
 * Priority: Latest supervisor comment > Latest lecturer assessment > Logbook entry status
 */
export function getLogbookDisplayStatus(entry: LogbookEntryWithComments): LogStatus {
  // Check supervisor comments first (highest priority)
  if (entry.comments && entry.comments.length > 0) {
    // Sort by createdAt to get the latest comment
    const sortedComments = [...entry.comments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const latestComment = sortedComments[0]
    
    switch (latestComment.status) {
      case 'APPROVED':
        return LogStatus.APPROVED
      case 'REJECTED':
        return LogStatus.REJECTED
      case 'NEEDS_REVISION':
        return LogStatus.PENDING
      case 'PENDING':
        return LogStatus.PENDING
      default:
        break
    }
  }

  // Check lecturer assessments (second priority)
  if (entry.assessments) {
    if (entry.assessments.status === 'COMPLETED') {
      return LogStatus.APPROVED
    }
  }

  // Fallback to logbook entry status
  return entry.status
}

/**
 * Get status badge props for consistent styling across the application
 */
export function getStatusBadgeProps(status: LogStatus) {
  switch (status) {
    case LogStatus.APPROVED:
      return {
        className: "bg-green-600",
        label: "Approved"
      }
    case LogStatus.REJECTED:
      return {
        className: "bg-red-600", 
        label: "Rejected"
      }
    case LogStatus.PENDING:
      return {
        className: "bg-yellow-600",
        label: "Pending Review"
      }
    case LogStatus.DRAFT:
      return {
        className: "bg-gray-100 text-gray-800",
        label: "Draft"
      }
    default:
      return {
        className: "bg-gray-100 text-gray-800",
        label: status
      }
  }
}

/**
 * Get supervisor review status badge props
 */
export function getSupervisorStatusBadgeProps(status: string) {
  switch (status) {
    case 'APPROVED':
      return {
        className: "bg-green-600",
        label: "Approved"
      }
    case 'REJECTED':
      return {
        className: "bg-red-600",
        label: "Rejected"
      }
    case 'NEEDS_REVISION':
      return {
        className: "bg-orange-600",
        label: "Needs Revision"
      }
    case 'PENDING':
      return {
        className: "bg-yellow-600",
        label: "Pending Review"
      }
    default:
      return {
        className: "bg-gray-100 text-gray-800",
        label: status
      }
  }
}
