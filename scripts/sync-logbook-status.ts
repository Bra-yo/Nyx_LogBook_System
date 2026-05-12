/**
 * Data migration script to sync logbook entry status with supervisor comments
 * This script fixes existing records where supervisor has approved an entry
 * but the LogbookEntry.status is still PENDING
 */

import { PrismaClient, LogStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function syncLogbookStatus() {
  try {
    console.log('Starting logbook status synchronization...')
    
    // Find all logbook entries that have supervisor comments
    const entriesWithComments = await prisma.logbookEntry.findMany({
      where: {
        comments: {
          some: {}
        }
      },
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })
    
    console.log(`Found ${entriesWithComments.length} entries with supervisor comments`)
    
    let updatedCount = 0
    
    for (const entry of entriesWithComments) {
      if (entry.comments.length > 0) {
        const latestComment = entry.comments[0]
        let newStatus: LogStatus
        
        // Map supervisor comment status to LogbookEntry status
        switch (latestComment.status) {
          case 'APPROVED':
            newStatus = LogStatus.APPROVED
            break
          case 'REJECTED':
            newStatus = LogStatus.REJECTED
            break
          case 'NEEDS_REVISION':
            newStatus = LogStatus.PENDING
            break
          case 'PENDING':
            newStatus = LogStatus.PENDING
            break
          default:
            newStatus = entry.status
        }
        
        // Only update if status needs to change
        if (newStatus !== entry.status) {
          await prisma.logbookEntry.update({
            where: { id: entry.id },
            data: { 
              status: newStatus,
              reviewedAt: newStatus === LogStatus.APPROVED || newStatus === LogStatus.REJECTED ? new Date() : entry.reviewedAt
            }
          })
          
          console.log(`Updated entry ${entry.id}: ${entry.status} -> ${newStatus} (supervisor comment: ${latestComment.status})`)
          updatedCount++
        }
      }
    }
    
    console.log(`Successfully updated ${updatedCount} logbook entries`)
    console.log('Logbook status synchronization completed')
    
  } catch (error) {
    console.error('Error during logbook status synchronization:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync function
syncLogbookStatus()
  .then(() => {
    console.log('Sync completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Sync failed:', error)
    process.exit(1)
  })
