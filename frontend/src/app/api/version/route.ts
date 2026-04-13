import { NextResponse } from "next/server";

/**
 * GET /api/version — returns the current build ID.
 *
 * The VersionGuard client component polls this every 60s.
 * When the response changes, it means a new deploy happened
 * and the user should refresh to get the latest code.
 *
 * Cache-Control: no-store ensures this is never cached.
 */
export async function GET() {
  // Next.js exposes the build ID from generateBuildId in next.config.js
  // In standalone mode, __NEXT_DATA__ isn't available server-side,
  // so we read it from the build manifest or use the env var.
  const buildId =
    process.env.NEXT_BUILD_ID ||
    process.env.__NEXT_BUILD_ID ||
    getBuildIdFromManifest();

  return NextResponse.json(
    {
      version: buildId || "unknown",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}

function getBuildIdFromManifest(): string {
  try {
    // In standalone builds, BUILD_ID file is at .next/BUILD_ID
    const fs = require("fs");
    const path = require("path");
    const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
    return fs.readFileSync(buildIdPath, "utf-8").trim();
  } catch {
    return "dev";
  }
}
