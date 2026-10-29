import { publicRecord, read } from "@/lib/server/db";
import { jsonOk } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";

/** GET /api/webhook-events — recent deliveries, newest first. */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  const events = await read((db) =>
    db.webhookEvents
      .filter((event) => event.workspaceId === workspaceId)
      .slice(0, 25)
      .map(publicRecord),
  );
  return jsonOk({ events });
}
