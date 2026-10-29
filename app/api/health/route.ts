/** Liveness probe — handy for confirming the backend is reachable. */
export async function GET() {
  return Response.json({
    ok: true,
    service: "reyvoca-api",
    phase: 2,
    time: new Date().toISOString(),
  });
}
