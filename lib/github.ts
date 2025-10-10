import { Octokit } from "octokit";
import fs from "fs";
import path from "path";

export async function ensureRepoAndPush(opts: {
  token: string;
  owner: string;
  repo: string;
  folder: string; // absolute path to push as repo root
  cname?: string;
}): Promise<{ url: string }> {
  const octokit = new Octokit({ auth: opts.token });

  // 1) Create repo if missing
  try {
    await octokit.request("GET /repos/{owner}/{repo}", {
      owner: opts.owner,
      repo: opts.repo,
    });
  } catch {
    await octokit.request("POST /user/repos", {
      name: opts.repo,
      private: false,
      auto_init: false,
      has_issues: false,
      has_wiki: false,
      has_projects: false,
    });
  }

  // 2) Get default branch SHA (or create main)
  let baseSha: string | undefined;
  try {
    const main = await octokit.request(
      "GET /repos/{owner}/{repo}/git/refs/heads/{ref}",
      { owner: opts.owner, repo: opts.repo, ref: "main" }
    );
    baseSha = main.data.object.sha;
  } catch {
    // Create an empty main with an initial commit via a dummy blob/tree
    const emptyTree = await octokit.request(
      "POST /repos/{owner}/{repo}/git/trees",
      { owner: opts.owner, repo: opts.repo, tree: [] }
    );
    const commit = await octokit.request(
      "POST /repos/{owner}/{repo}/git/commits",
      {
        owner: opts.owner,
        repo: opts.repo,
        message: "init",
        tree: emptyTree.data.sha,
      }
    );
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: opts.owner,
      repo: opts.repo,
      ref: "refs/heads/main",
      sha: commit.data.sha,
    });
    baseSha = commit.data.sha;
  }

  // 3) Walk folder and create tree
  function walk(
    dir: string,
    prefix = ""
  ): {
    path: string;
    mode: string;
    type: "blob" | "tree";
    content?: string;
  }[] {
    const entries = fs.readdirSync(dir);
    const items: {
      path: string;
      mode: string;
      type: "blob" | "tree";
      content?: string;
    }[] = [];
    for (const name of entries) {
      const p = path.join(dir, name);
      const rel = path.posix.join(prefix, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        items.push(...walk(p, rel));
      } else {
        const content = fs.readFileSync(p, "utf8");
        items.push({ path: rel, mode: "100644", type: "blob", content });
      }
    }
    return items;
  }

  const files = walk(opts.folder);
  if (opts.cname) {
    files.push({
      path: "CNAME",
      mode: "100644",
      type: "blob",
      content: opts.cname,
    });
  }

  const tree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
    owner: opts.owner,
    repo: opts.repo,
    base_tree: baseSha,
    tree: files,
  });

  const commit = await octokit.request(
    "POST /repos/{owner}/{repo}/git/commits",
    {
      owner: opts.owner,
      repo: opts.repo,
      message: "chore: publish funnel page",
      tree: tree.data.sha,
      parents: baseSha ? [baseSha] : [],
    }
  );

  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
    owner: opts.owner,
    repo: opts.repo,
    ref: "heads/main",
    sha: commit.data.sha,
    force: true,
  });

  // 4) Enable Pages
  try {
    await octokit.request("PUT /repos/{owner}/{repo}/pages", {
      owner: opts.owner,
      repo: opts.repo,
      build_type: "legacy",
      source: { branch: "main", path: "/" },
    });
  } catch (error) {
    // Pages might already be enabled
    console.log("Pages enable error (might already be enabled):", error);
  }

  const pages = await octokit.request("GET /repos/{owner}/{repo}/pages", {
    owner: opts.owner,
    repo: opts.repo,
  });
  const url =
    pages.data.html_url || `https://${opts.owner}.github.io/${opts.repo}/`;
  return { url };
}
