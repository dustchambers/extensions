import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState, useEffect } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import { formatFileSize, getFileType } from "@/utils/file-info";
import { generateListThumbnail } from "@/utils/thumbnails";
import FileDetail from "@/components/FileDetail";

interface FileListProps {
  filePaths: string[];
}

interface FileListItem {
  path: string;
  name: string;
  directory: string;
  sizeFormatted: string;
  fileType: string;
  isDirectory: boolean;
  isImage: boolean;
  thumbnail: string | null;
}

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".webp",
  ".heic",
  ".heif",
  ".svg",
  ".ico",
  ".raw",
  ".cr2",
  ".nef",
  ".arw",
  ".dng",
  ".psd",
]);

function getIconForFile(item: FileListItem): Icon {
  if (item.isDirectory) return Icon.Folder;
  if (item.isImage) return Icon.Image;
  return Icon.Document;
}

export default function FileList({ filePaths }: FileListProps) {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFileInfo() {
      const items: FileListItem[] = [];

      for (const filePath of filePaths) {
        try {
          const stats = await fs.stat(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const isDirectory = stats.isDirectory();

          const thumb = generateListThumbnail(filePath);

          items.push({
            path: filePath,
            name: path.basename(filePath),
            directory: path.dirname(filePath),
            sizeFormatted: formatFileSize(stats.size),
            fileType: isDirectory ? "Folder" : getFileType(ext),
            isDirectory,
            isImage: IMAGE_EXTENSIONS.has(ext),
            thumbnail: thumb,
          });
        } catch {
          // If we can't stat a file, still include it with fallback info
          items.push({
            path: filePath,
            name: path.basename(filePath),
            directory: path.dirname(filePath),
            sizeFormatted: "Unknown",
            fileType: "Unknown",
            isDirectory: false,
            isImage: false,
            thumbnail: null,
          });
        }
      }

      setFiles(items);
      setIsLoading(false);
    }

    loadFileInfo();
  }, [filePaths]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter files...">
      {files.map((item) => (
        <List.Item
          key={item.path}
          title={item.name}
          subtitle={item.directory}
          icon={
            item.thumbnail ? { source: item.thumbnail } : getIconForFile(item)
          }
          accessories={[{ text: item.sizeFormatted }, { tag: item.fileType }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Details"
                icon={Icon.Eye}
                target={<FileDetail filePath={item.path} />}
              />
              <Action.CopyToClipboard title="Copy Path" content={item.path} />
              <Action.Open title="Open File" target={item.path} />
              <Action.ShowInFinder path={item.path} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
