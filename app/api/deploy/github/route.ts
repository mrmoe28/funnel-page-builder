import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { ensureRepoAndPush } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { slug, repoName, githubUsername, customDomain } = await req.json();

    if (!slug || !repoName || !githubUsername) {
      return NextResponse.json(
        { error: "slug, repoName, githubUsername required" },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN not configured on server" },
        { status: 500 }
      );
    }

    const folder = path.join(process.cwd(), "public", "funnels", slug);
    if (!fs.existsSync(folder)) {
      return NextResponse.json({ error: "funnel not found" }, { status: 404 });
    }

    const { url } = await ensureRepoAndPush({
      token,
      owner: githubUsername,
      repo: repoName.toLowerCase(),
      folder,
      cname: customDomain,
    });

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("Deploy error:", e);
    return NextResponse.json(
      { error: e?.message || "deploy failed" },
      { status: 500 }
    );
  }
}
