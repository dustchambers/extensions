import { showToast, Toast, environment } from "@raycast/api";
import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import path from "path";
import { VolumeInfo } from "./utils/volumes";

export interface PipelineOptions {
  volumes: VolumeInfo[];
  destParent: string;
  folderName: string;
  targetDates: string[];
  starRating: number | null;
  renameFiles: boolean;
  skipDuplicates: boolean;
  verifyCopy: boolean;
  openPhotoMechanic: boolean;
  ejectCards: boolean;
}

/**
 * Launch the ingest pipeline as a detached background process.
 * The runner.mjs script in assets/ runs independently — it survives
 * even if the Raycast extension is closed or killed.
 * Progress and completion are shown via macOS notifications.
 */
export async function runIngestPipeline(opts: PipelineOptions): Promise<void> {
  const configPath = path.join(
    environment.supportPath,
    `ingest-config-${Date.now()}.json`,
  );
  const runnerPath = path.join(environment.assetsPath, "runner.mjs");

  // Write config for the runner
  await writeFile(
    configPath,
    JSON.stringify({
      volumes: opts.volumes.map((v) => ({ path: v.path, name: v.name })),
      destParent: opts.destParent,
      folderName: opts.folderName,
      targetDates: opts.targetDates,
      starRating: opts.starRating,
      renameFiles: opts.renameFiles,
      skipDuplicates: opts.skipDuplicates,
      verifyCopy: opts.verifyCopy,
      openPhotoMechanic: opts.openPhotoMechanic,
      ejectCards: opts.ejectCards,
    }),
    "utf-8",
  );

  // Use the same node binary that's running the extension — bare "node"
  // won't resolve inside Raycast's restricted PATH.
  const nodeBin = process.execPath;

  // Spawn detached — survives parent process being killed
  const child = spawn(nodeBin, [runnerPath, configPath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  await showToast({
    style: Toast.Style.Success,
    title: "Magic Ingest started",
    message: "Running in background",
  });
}
