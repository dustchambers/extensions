import { rename } from "fs/promises";
import path from "path";
import { SIDECAR_EXTENSIONS } from "./constants";
import { VerifyResult } from "./verifier";
import { CopyResult } from "./types";
import { logLine } from "./logger";

export interface RenameResult {
  oldPath: string;
  newPath: string;
  success: boolean;
  error?: string;
}

/**
 * Rename files with folder-name prefix. Skips verification failures.
 * Sidecars only renamed if their parent media file was also renamed.
 * @param verifyResults null means verification was skipped (all eligible)
 */
export async function renameFiles(
  copyResults: CopyResult[],
  verifyResults: VerifyResult[] | null,
  folderName: string,
  onProgress: (current: number, total: number) => void,
): Promise<{ results: RenameResult[]; renamed: number; errors: string[] }> {
  const failedPaths = new Set<string>();
  if (verifyResults) {
    for (const vr of verifyResults) {
      if (!vr.passed) {
        failedPaths.add(vr.destPath);
      }
    }
  }

  const eligible = copyResults.filter(
    (r) => r.success && !failedPaths.has(r.destPath),
  );

  const mediaFiles = eligible.filter((r) => {
    const ext = path.extname(r.destPath).toLowerCase();
    return !SIDECAR_EXTENSIONS.includes(ext);
  });
  const sidecarFiles = eligible.filter((r) => {
    const ext = path.extname(r.destPath).toLowerCase();
    return SIDECAR_EXTENSIONS.includes(ext);
  });

  const renamedStems = new Set<string>();
  const results: RenameResult[] = [];
  const errors: string[] = [];
  let renamed = 0;
  const allToRename = [...mediaFiles, ...sidecarFiles];

  for (let i = 0; i < allToRename.length; i++) {
    const copy = allToRename[i];
    onProgress(i + 1, allToRename.length);

    const dir = path.dirname(copy.destPath);
    const currentFilename = path.basename(copy.destPath);
    const ext = path.extname(currentFilename).toLowerCase();
    const stem = path.basename(currentFilename, path.extname(currentFilename));

    if (SIDECAR_EXTENSIONS.includes(ext) && !renamedStems.has(stem)) {
      continue;
    }

    const newFilename = `${folderName}_${currentFilename}`;
    const newPath = path.join(dir, newFilename);

    try {
      await rename(copy.destPath, newPath);
      renamed++;
      if (!SIDECAR_EXTENSIONS.includes(ext)) {
        renamedStems.add(stem);
      }
      results.push({ oldPath: copy.destPath, newPath, success: true });
      await logLine(`Renamed: ${currentFilename} → ${newFilename}`);
    } catch (err) {
      const errMsg = `Rename failed: ${currentFilename} — ${String(err)}`;
      errors.push(errMsg);
      results.push({
        oldPath: copy.destPath,
        newPath,
        success: false,
        error: String(err),
      });
      await logLine(errMsg);
    }
  }

  return { results, renamed, errors };
}
