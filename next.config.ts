import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

function getAllowedDevOrigins() {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);

  return Array.from(new Set(addresses));
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  reactCompiler: true,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
