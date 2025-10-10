import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import archiver from "archiver";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    const folder = path.join(process.cwd(), "public", "funnels", slug);

    if (!slug || !fs.existsSync(folder)) {
      return new Response("Not found", { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });

    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => {
          controller.enqueue(new Uint8Array(chunk as any));
        });
        archive.on("end", () => controller.close());
        archive.on("error", (err) => controller.error(err));

        archive.directory(folder, false);
        archive.finalize();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}.zip"`,
      },
    });
  } catch (e: any) {
    console.error("ZIP error:", e);
    return new Response("ZIP creation failed", { status: 500 });
  }
}
