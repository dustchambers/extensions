import { updateCommandMetadata } from "@raycast/api";
import { readFile } from "fs/promises";
import { homedir } from "os";
import path from "path";

const PID_FILE = path.join(
  homedir(),
  "Library",
  "Logs",
  "raycast-photo-ingest.pid",
);

const SHORT_LABELS: Record<string, string> = {
  scanning: "Scanning",
  filtering: "Filtering",
  copying: "Copying",
  verifying: "Verifying",
  renaming: "Renaming",
  ejecting: "Ejecting",
};

function progressBar(current: number, total: number, width = 10): string {
  if (total === 0) return "";
  const filled = Math.round((current / total) * width);
  return "■".repeat(filled) + "□".repeat(width - filled);
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export default async function Command() {
  try {
    const raw = await readFile(PID_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const running = isProcessAlive(parsed.pid) && parsed.stage !== "done";

    if (running) {
      const label = SHORT_LABELS[parsed.stage] || parsed.stage;
      const { current, total } = parsed.progress;
      const bar = total > 0 ? progressBar(current, total) : "";
      const pct = total > 0 ? ` ${Math.round((current / total) * 100)}%` : "";
      await updateCommandMetadata({
        subtitle: `${label}  ${bar}${pct}`,
      });
    } else {
      await updateCommandMetadata({ subtitle: "" });
    }
  } catch {
    await updateCommandMetadata({ subtitle: "" });
  }
}
