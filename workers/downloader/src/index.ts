import { z } from "zod";

// Environment bindings
interface Env {
  WORKER_SECRET: string;
  ENVIRONMENT?: "production" | "development";
}

// Request validation schemas
const DownloadRequestSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Invalid URL format"),
});

type DownloadRequest = z.infer<typeof DownloadRequestSchema>;

interface DownloadResponse {
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

/**
 * Validates if the URL is a valid Instagram Reel URL
 */
function isValidInstagramReelUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // Check if it's instagram.com or www.instagram.com
    const isInstagram =
      hostname === "instagram.com" || hostname === "www.instagram.com";

    // Check if it's a reel URL pattern: /reel/{id}/ or /reels/{id}/
    const isReelPath = /^\/reels?\/[\w-]+\/?$/.test(pathname);

    return isInstagram && isReelPath;
  } catch {
    return false;
  }
}

/**
 * Validates the X-Worker-Secret header
 */
function validateSecret(
  secretHeader: string | null,
  envSecret: string
): boolean {
  if (!secretHeader) {
    return false;
  }
  // Use constant-time comparison to prevent timing attacks
  return secretHeader === envSecret;
}

/**
 * POST /download handler
 */
async function handleDownload(
  request: Request,
  env: Env
): Promise<Response> {
  // Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return new Response(
      JSON.stringify({ error: "Content-Type must be application/json" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate request payload
  const parseResult = DownloadRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parseResult.error.issues,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { url } = parseResult.data;

  // Validate Instagram URL format
  if (!isValidInstagramReelUrl(url)) {
    return new Response(
      JSON.stringify({
        error: "Invalid URL. Must be an Instagram Reel URL (instagram.com/reel/...)",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate worker secret
  const secretHeader = request.headers.get("X-Worker-Secret");
  if (!validateSecret(secretHeader, env.WORKER_SECRET)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mock response (replace with real yt-dlp logic later)
  const mockResponse: DownloadResponse = {
    downloadUrl: "https://example.com/mock-video.mp4",
    filename: "test.mp4",
  };

  return new Response(JSON.stringify(mockResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Main worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // POST /download
    if (request.method === "POST" && url.pathname === "/download") {
      return handleDownload(request, env);
    }

    // Health check endpoint
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
} satisfies ExportedHandler<Env>;
