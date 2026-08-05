import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurriculumRegistry } from '@/lib/curriculum/registry'
import { importCurriculumPackages } from '@/lib/curriculum/import-service'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { packageIds?: string[] }
    const packageIds = Array.isArray(body.packageIds) ? body.packageIds : []

    const packages = getCurriculumRegistry().filter((curriculum) => packageIds.includes(curriculum.id))
    if (packages.length === 0) {
      return NextResponse.json({ success: false, error: 'No curriculum packages were selected' }, { status: 400 })
    }

    const summary = await importCurriculumPackages(packages)
    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('Error importing curriculum packages:', error)
    return NextResponse.json({ success: false, error: 'Failed to import curriculum packages' }, { status: 500 })
  }
}
