import { Action, ActionPanel, Detail, Clipboard, Icon } from "@raycast/api";
import type { FC } from "react";

import { useFileMetadata } from "@/hooks/use-file-metadata";
import FileMetadata from "@/components/FileMetadata";
import RawMetadata from "@/components/RawMetadata";

interface FileDetailProps {
  filePath: string;
}

function buildMarkdownBody(data: ReturnType<typeof useFileMetadata>): string {
  const { fileStats, mdls, gpsCoordinates, gpsLinks, colorAverage } = data;

  if (!fileStats) {
    return "# Loading file information...";
  }

  const sections: string[] = [];

  // Title
  sections.push(`# ${fileStats.name}`);

  // Image preview — use resized 300px version if available
  if (fileStats.isImage) {
    const imgPath = data.previewPath || fileStats.path;
    sections.push(`![${fileStats.name}](${encodeURI(imgPath)})`);
  }

  // Color average for images
  if (fileStats.isImage && colorAverage) {
    sections.push(`**Average Color:** \`${colorAverage}\``);
  }

  // GPS Map Links
  if (gpsCoordinates && gpsLinks) {
    sections.push("---");
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

  // Categorized Spotlight metadata
  // Note: mdls.raw keys already have the kMDItem prefix stripped (e.g. "ContentType" not "kMDItemContentType")
  // Keys starting with underscore (e.g. "_DisplayNameWithExtensions") are also normalized
  if (mdls && mdls.raw && Object.keys(mdls.raw).length > 0) {
    sections.push("---");
    sections.push("### Spotlight Metadata");

    const categories: Record<string, [string, string][]> = {
      Content: [],
      Dates: [],
      Media: [],
      Location: [],
      Document: [],
      Source: [],
      Other: [],
    };

    // Keys match mdls.raw format (kMDItem prefix already stripped)
    const categoryMap: Record<string, string> = {
      ContentType: "Content",
      ContentTypeTree: "Content",
      Kind: "Content",
      DisplayName: "Content",
      ContentCreationDate: "Dates",
      ContentModificationDate: "Dates",
      LastUsedDate: "Dates",
      DateAdded: "Dates",
      UsedDates: "Dates",
      AttributeChangeDate: "Dates",
      PixelHeight: "Media",
      PixelWidth: "Media",
      ColorSpace: "Media",
      BitsPerSample: "Media",
      DPIHeight: "Media",
      DPIWidth: "Media",
      HasAlphaChannel: "Media",
      ProfileName: "Media",
      DurationSeconds: "Media",
      TotalBitRate: "Media",
      AudioChannelCount: "Media",
      AudioSampleRate: "Media",
      Codecs: "Media",
      MediaTypes: "Media",
      Streamable: "Media",
      VideoBitRate: "Media",
      Latitude: "Location",
      Longitude: "Location",
      Altitude: "Location",
      City: "Location",
      Country: "Location",
      StateOrProvince: "Location",
      NamedLocation: "Location",
      GPSAreaInformation: "Location",
      PageCount: "Document",
      NumberOfPages: "Document",
      Authors: "Document",
      Title: "Document",
      Subject: "Document",
      Keywords: "Document",
      Creator: "Document",
      Version: "Document",
      Copyright: "Document",
      Description: "Document",
      WhereFroms: "Source",
      DownloadedDate: "Source",
      FinderComment: "Source",
    };

    function humanizeKey(key: string): string {
      // Strip leading underscores (e.g. "_DisplayNameWithExtensions")
      let clean = key.replace(/^_+/, "");
      // Insert spaces before uppercase letters
      clean = clean.replace(/([a-z])([A-Z])/g, "$1 $2");
      return clean;
    }

    for (const [key, value] of Object.entries(mdls.raw)) {
      if (!value || value === "(null)" || value === "") continue;
      // Also try stripping leading underscores for category lookup
      const normalizedKey = key.replace(/^_+/, "");
      const cat = categoryMap[key] || categoryMap[normalizedKey] || "Other";
      categories[cat].push([humanizeKey(key), String(value)]);
    }

    for (const [catName, entries] of Object.entries(categories)) {
      if (entries.length === 0) continue;
      sections.push("");
      sections.push(`#### ${catName}`);
      for (const [label, value] of entries) {
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
