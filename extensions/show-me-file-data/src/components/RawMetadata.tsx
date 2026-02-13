import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { useFileMetadata } from "@/hooks/use-file-metadata";

interface RawMetadataProps {
  filePath: string;
}

export default function RawMetadata({ filePath }: RawMetadataProps) {
  const {
    fileStats,
    mdls,
    exifSummary,
    gpsCoordinates,
    gpsLinks,
    colorAverage,
    aiDescription,
    isLoading,
  } = useFileMetadata(filePath);

  const allMetadata = {
    file: fileStats
      ? {
          name: fileStats.name,
          extension: fileStats.extension,
          size: fileStats.size,
          sizeFormatted: fileStats.sizeFormatted,
          path: fileStats.path,
          directory: fileStats.directory,
          isDirectory: fileStats.isDirectory,
          isSymlink: fileStats.isSymlink,
          created: fileStats.created,
          modified: fileStats.modified,
          accessed: fileStats.accessed,
          permissions: fileStats.permissions,
          mode: fileStats.mode,
          uid: fileStats.uid,
          gid: fileStats.gid,
          inode: fileStats.inode,
          hardLinks: fileStats.hardLinks,
          fileType: fileStats.fileType,
          isImage: fileStats.isImage,
        }
      : null,
    spotlight: mdls?.raw ?? null,
    exif: exifSummary ?? null,
    gps: gpsCoordinates
      ? {
          ...gpsCoordinates,
          links: gpsLinks,
        }
      : null,
    colorAverage,
    aiDescription,
  };

  const jsonString = JSON.stringify(allMetadata, null, 2);

  const markdown = `# Raw Metadata

**${fileStats?.name ?? "Unknown"}**

\`\`\`json
${jsonString}
\`\`\`
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy JSON to Clipboard"
            content={jsonString}
            icon={Icon.Clipboard}
          />
          <Action.CopyToClipboard
            title="Copy File Path"
            content={filePath}
            icon={Icon.Document}
          />
        </ActionPanel>
      }
    />
  );
}
