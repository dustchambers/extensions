import { usePromise } from "@raycast/utils";

import { getFileStats } from "@/utils/file-info";
import type { FileStats } from "@/utils/file-info";
import { getMdlsMetadata } from "@/utils/mdls";
import type { MdlsMetadata } from "@/utils/mdls";
import {
  getExifData,
  getGpsCoordinates,
  buildGpsLinks,
  getImageColorAverage,
  buildExifSummary,
} from "@/utils/image";
import type { GpsCoordinates, GpsLinks } from "@/utils/image";
import { generateDetailPreview } from "@/utils/thumbnails";
import type { Tags } from "exifreader";

export interface FileMetadataResult {
  fileStats: FileStats | null;
  mdls: MdlsMetadata | null;
  exifTags: Tags | null;
  exifSummary: Record<string, string> | null;
  gpsCoordinates: GpsCoordinates | null;
  gpsLinks: GpsLinks | null;
  colorAverage: string | null;
  previewPath: string | null;
  isLoading: boolean;
}

export function useFileMetadata(filePath: string): FileMetadataResult {
  // Basic file stats
  const { data: fileStats, isLoading: statsLoading } = usePromise(
    async (p: string) => getFileStats(p),
    [filePath],
  );

  // Spotlight metadata
  const { data: mdls, isLoading: mdlsLoading } = usePromise(
    async (p: string) => getMdlsMetadata(p),
    [filePath],
  );

  // EXIF data (only for images)
  const isImage = fileStats?.isImage ?? false;
  const { data: exifTags, isLoading: exifLoading } = usePromise(
    async (p: string, shouldLoad: boolean) => {
      if (!shouldLoad) return null;
      return getExifData(p);
    },
    [filePath, isImage],
  );

  // Color average (only for images)
  const { data: colorAverage } = usePromise(
    async (p: string, shouldLoad: boolean) => {
      if (!shouldLoad) return null;
      return getImageColorAverage(p);
    },
    [filePath, isImage],
  );

  // Image preview (only for images) — resize to 300px
  const { data: previewPath } = usePromise(
    async (p: string, shouldLoad: boolean) => {
      if (!shouldLoad) return null;
      return generateDetailPreview(p, 300);
    },
    [filePath, isImage],
  );

  // Derived: EXIF summary, GPS
  const exifSummary = exifTags ? buildExifSummary(exifTags) : null;
  const gpsCoordinates = exifTags ? getGpsCoordinates(exifTags) : null;
  const gpsLinks = gpsCoordinates ? buildGpsLinks(gpsCoordinates) : null;

  const isLoading = statsLoading || mdlsLoading || exifLoading;

  return {
    fileStats: fileStats ?? null,
    mdls: mdls ?? null,
    exifTags: exifTags ?? null,
    exifSummary,
    gpsCoordinates,
    gpsLinks,
    colorAverage: colorAverage ?? null,
    previewPath: previewPath ?? null,
    isLoading,
  };
}
