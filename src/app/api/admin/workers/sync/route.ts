import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BgErpClient } from "@/lib/erp/erp-client";
import { ConsoleSyncLogger } from "@/lib/erp/sync-logger";
import { BgWorkerMapper } from "@/lib/erp/worker-mapper";
import { BgWorkerSyncService } from "@/lib/erp/worker-sync-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    void request;

    const client = new BgErpClient();
    const logger = new ConsoleSyncLogger();
    const mapper = new BgWorkerMapper();
    const service = new BgWorkerSyncService(client, mapper, logger);
    const result = await service.syncWorkers();

    return NextResponse.json({
      success: result.success,
      created: result.createdCount,
      updated: result.updatedCount,
      inactive: result.inactiveCount,
      skipped: result.skippedCount,
      errors: result.errors.length,
      duration: result.duration,
      lastSync: result.lastSyncAt,
    });
  } catch (error) {
    console.error("Worker sync route error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to synchronize workers.",
      },
      { status: 500 },
    );
  }
}
