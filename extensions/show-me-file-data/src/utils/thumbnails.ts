import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

const THUMB_DIR = path.join(tmpdir(), "smd_thumbs");
const PREVIEW_DIR = path.join(tmpdir(), "smd_previews");

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function pathHash(filePath: string): string {
  return createHash("md5").update(filePath).digest("hex").slice(0, 12);
}

/**
 * Generate a 64px Quick Look thumbnail for any file type.
 * Returns the thumbnail path, or null if generation fails.
 */
export function generateListThumbnail(filePath: string): string | null {
  try {
    ensureDir(THUMB_DIR);
    const hash = pathHash(filePath);
    const outPath = path.join(THUMB_DIR, `${hash}.png`);

    // Check cache
    if (existsSync(outPath)) return outPath;

    // qlmanage outputs <basename>.png in the output dir
    const basename = path.basename(filePath);
    const qlOutput = path.join(THUMB_DIR, `${basename}.png`);

    execSync(
      `qlmanage -t -s 64 -o ${JSON.stringify(THUMB_DIR)} ${JSON.stringify(filePath)}`,
      {
        timeout: 3000,
        stdio: "pipe",
      },
    );

    // qlmanage names output after the source file — rename to our hash
    if (existsSync(qlOutput) && qlOutput !== outPath) {
      execSync(`mv ${JSON.stringify(qlOutput)} ${JSON.stringify(outPath)}`);
    }

    return existsSync(outPath) ? outPath : null;
  } catch {
    return null;
  }
}

/**
 * Generate a 300px-wide preview image for the Detail markdown body.
 * Only useful for image files. Returns the preview path, or null.
 */
export function generateDetailPreview(
  filePath: string,
  maxWidth = 300,
): string | null {
  try {
    ensureDir(PREVIEW_DIR);
    const hash = pathHash(filePath);
    const ext = path.extname(filePath).toLowerCase();
    // Use jpg for efficiency, png for transparency-capable formats
    const outExt = [".png", ".gif", ".webp", ".svg"].includes(ext)
      ? "png"
      : "jpg";
    const outPath = path.join(PREVIEW_DIR, `${hash}.${outExt}`);

    // Check cache
    if (existsSync(outPath)) return outPath;

    // Use sips to resize — fast, no Python dependency
    execSync(
      `sips --resampleWidth ${maxWidth} ${JSON.stringify(filePath)} --out ${JSON.stringify(outPath)}`,
      { timeout: 5000, stdio: "pipe" },
    );

    return existsSync(outPath) ? outPath : null;
  } catch {
    return null;
  }
}
