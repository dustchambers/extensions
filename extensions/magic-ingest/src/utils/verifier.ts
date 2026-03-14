import { createHash } from "crypto";
import { createReadStream } from "fs";
import { CopyResult } from "./copier";
import { logLine } from "./logger";

function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export interface VerifyResult {
  destPath: string;
  sourcePath: string;
  passed: boolean;
  error?: string;
}

export async function verifyFiles(
  copyResults: CopyResult[],
  onProgress: (current: number, total: number) => void,
): Promise<{
  results: VerifyResult[];
  passed: number;
  failed: number;
  errors: string[];
}> {
  const successfulCopies = copyResults.filter((r) => r.success);
  const results: VerifyResult[] = [];
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < successfulCopies.length; i++) {
    const copy = successfulCopies[i];
    onProgress(i + 1, successfulCopies.length);

    try {
      const [sourceHash, destHash] = await Promise.all([
        hashFile(copy.sourcePath),
        hashFile(copy.destPath),
      ]);

      if (sourceHash === destHash) {
        passed++;
        results.push({
          destPath: copy.destPath,
          sourcePath: copy.sourcePath,
          passed: true,
        });
        await logLine(`Verified OK: ${copy.destPath}`);
      } else {
        failed++;
        const errMsg = `Verification FAILED: ${copy.destPath} (hash mismatch)`;
        errors.push(errMsg);
        results.push({
          destPath: copy.destPath,
          sourcePath: copy.sourcePath,
          passed: false,
          error: "hash mismatch",
        });
        await logLine(errMsg);
      }
    } catch (err) {
      failed++;
      const errMsg = `Verification error: ${copy.destPath} — ${String(err)}`;
      errors.push(errMsg);
      results.push({
        destPath: copy.destPath,
        sourcePath: copy.sourcePath,
        passed: false,
        error: String(err),
      });
      await logLine(errMsg);
    }
  }

  return { results, passed, failed, errors };
}
