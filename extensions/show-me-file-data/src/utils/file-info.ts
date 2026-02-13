import fs from "node:fs/promises";
import path from "node:path";

export interface FileStats {
  name: string;
  extension: string;
  size: number;
  sizeFormatted: string;
  path: string;
  directory: string;
  isDirectory: boolean;
  isSymlink: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
  permissions: string;
  mode: number;
  uid: number;
  gid: number;
  inode: number;
  hardLinks: number;
  fileType: string;
  isImage: boolean;
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

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".wmv",
  ".flv",
  ".webm",
  ".m4v",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
  ".wma",
  ".m4a",
  ".aiff",
]);

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".swift",
  ".kt",
  ".sh",
  ".bash",
  ".zsh",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".sql",
  ".md",
  ".mdx",
]);

const ARCHIVE_EXTENSIONS = new Set([
  ".zip",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
  ".7z",
  ".rar",
  ".dmg",
  ".iso",
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".rtf",
  ".csv",
  ".pages",
  ".numbers",
  ".keynote",
]);

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatPermissions(mode: number): string {
  const perms = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
  const owner = perms[(mode >> 6) & 7];
  const group = perms[(mode >> 3) & 7];
  const other = perms[mode & 7];
  return `${owner}${group}${other}`;
}

export function getFileType(ext: string): string {
  const lower = ext.toLowerCase();
  if (IMAGE_EXTENSIONS.has(lower)) return "Image";
  if (VIDEO_EXTENSIONS.has(lower)) return "Video";
  if (AUDIO_EXTENSIONS.has(lower)) return "Audio";
  if (CODE_EXTENSIONS.has(lower)) return "Code";
  if (ARCHIVE_EXTENSIONS.has(lower)) return "Archive";
  if (DOCUMENT_EXTENSIONS.has(lower)) return "Document";
  return "Other";
}

export function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function getFileStats(filePath: string): Promise<FileStats> {
  const stats = await fs.stat(filePath);
  const lstat = await fs.lstat(filePath);
  const ext = path.extname(filePath);

  return {
    name: path.basename(filePath),
    extension: ext,
    size: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    path: filePath,
    directory: path.dirname(filePath),
    isDirectory: stats.isDirectory(),
    isSymlink: lstat.isSymbolicLink(),
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    permissions: formatPermissions(stats.mode & 0o777),
    mode: stats.mode,
    uid: stats.uid,
    gid: stats.gid,
    inode: stats.ino,
    hardLinks: stats.nlink,
    fileType: stats.isDirectory() ? "Folder" : getFileType(ext),
    isImage: isImageFile(filePath),
  };
}
