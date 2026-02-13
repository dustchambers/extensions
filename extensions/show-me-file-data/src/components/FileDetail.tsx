import { Action, ActionPanel, Detail, Clipboard, Icon } from "@raycast/api";
import type { FC } from "react";

import { useFileMetadata } from "@/hooks/use-file-metadata";
import FileMetadata from "@/components/FileMetadata";
import RawMetadata from "@/components/RawMetadata";

interface FileDetailProps {
  filePath: string;
}

// Keys already shown in the sidebar — skip these in the markdown body
const SIDEBAR_SHOWN_KEYS = new Set([
  // Basic Info section
  "DisplayName",
  "Kind",
  // Spotlight section
  "ContentType",
  "Creator",
  "Version",
  "FinderComment",
  "NumberOfPages",
  "Authors",
  "WhereFroms",
  // Image Details section
  "PixelHeight",
  "PixelWidth",
  "ColorSpace",
  "BitsPerSample",
  "DPIHeight",
  "DPIWidth",
  "HasAlphaChannel",
  "ProfileName",
  // Audio/Video section
  "DurationSeconds",
  "TotalBitRate",
  "AudioChannelCount",
  "AudioSampleRate",
  "Title",
  "Album",
  "MusicalGenre",
  "Composer",
]);

function buildMarkdownBody(data: ReturnType<typeof useFileMetadata>): string {
  const { fileStats, mdls, gpsCoordinates, gpsLinks } = data;

  if (!fileStats) {
    return "# Loading file information...";
  }

  const sections: string[] = [];

  // Image preview — use resized 300px version if available
  if (fileStats.isImage) {
    const imgPath = data.previewPath || fileStats.path;
    sections.push(`![${fileStats.name}](${encodeURI(imgPath)})`);
  }

  // GPS Map Links (sidebar can't render clickable links)
  if (gpsCoordinates && gpsLinks) {
    sections.push("### 📍 GPS Location");
    sections.push(
      `**Coordinates:** ${Math.abs(gpsCoordinates.latitude).toFixed(6)}${gpsCoordinates.latitude >= 0 ? "N" : "S"}, ${Math.abs(gpsCoordinates.longitude).toFixed(6)}${gpsCoordinates.longitude >= 0 ? "E" : "W"}`,
    );
    sections.push("");
    sections.push(`- [Apple Maps](${gpsLinks.appleMaps})`);
    sections.push(`- [Google Maps](${gpsLinks.googleMaps})`);
    sections.push(`- [OpenStreetMap](${gpsLinks.openStreetMap})`);
    sections.push(`- [Bing Maps](${gpsLinks.bingMaps})`);
  }

  // Deep-cut Spotlight metadata — only keys NOT already in sidebar
  if (mdls && mdls.raw && Object.keys(mdls.raw).length > 0) {
    function humanizeKey(key: string): string {
      let clean = key.replace(/^_+/, "");
      clean = clean.replace(/([a-z])([A-Z])/g, "$1 $2");
      return clean;
    }

    const deepCuts: [string, string][] = [];
    for (const [key, value] of Object.entries(mdls.raw)) {
      if (!value || value === "(null)" || value === "") continue;
      const normalizedKey = key.replace(/^_+/, "");
      if (SIDEBAR_SHOWN_KEYS.has(key) || SIDEBAR_SHOWN_KEYS.has(normalizedKey))
        continue;
      deepCuts.push([humanizeKey(key), String(value)]);
    }

    if (deepCuts.length > 0) {
      sections.push("---");
      sections.push("### Spotlight Deep Cuts");
      for (const [label, value] of deepCuts) {
        sections.push(`**${label}:** ${value}`);
      }
    }
  }

  return sections.join("\n\n");
}

function buildAllMetadataJson(
  data: ReturnType<typeof useFileMetadata>,
): string {
  const { fileStats, mdls, exifSummary, gpsCoordinates, colorAverage } = data;

  const combined: Record<string, unknown> = {};

  if (fileStats) {
    combined.fileStats = fileStats;
  }
  if (mdls?.raw) {
    combined.spotlightMetadata = mdls.raw;
  }
  if (exifSummary && Object.keys(exifSummary).length > 0) {
    combined.exifSummary = exifSummary;
  }
  if (gpsCoordinates) {
    combined.gpsCoordinates = gpsCoordinates;
  }
  if (colorAverage) {
    combined.colorAverage = colorAverage;
  }

  return JSON.stringify(combined, null, 2);
}

const FileDetail: FC<FileDetailProps> = ({ filePath }) => {
  const metadata = useFileMetadata(filePath);
  const { fileStats, mdls, exifSummary, colorAverage, isLoading } = metadata;

  const markdown = buildMarkdownBody(metadata);
  const allMetadataJson = buildAllMetadataJson(metadata);

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        <FileMetadata
          fileStats={fileStats}
          mdls={mdls}
          exifSummary={exifSummary}
          colorAverage={colorAverage}
        />
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section title="File Actions">
            <Action
              title="Copy File Path"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              onAction={() => Clipboard.copy(filePath)}
            />
            <Action
              title="Copy All Metadata as JSON"
              icon={Icon.Document}
              shortcut={{ modifiers: ["cmd", "shift"], key: "j" }}
              onAction={() => Clipboard.copy(allMetadataJson)}
            />
            <Action.Open
              title="Open File"
              target={filePath}
              icon={Icon.Finder}
            />
            <Action.ShowInFinder path={filePath} />
          </ActionPanel.Section>
          <ActionPanel.Section title="Inspect">
            <Action.Push
              title="View Raw Metadata"
              icon={Icon.Code}
              shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
              target={<RawMetadata filePath={filePath} />}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
};

export default FileDetail;
