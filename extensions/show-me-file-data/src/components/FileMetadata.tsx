import { Color, Detail, Icon, getPreferenceValues } from "@raycast/api";
import type { FC, ReactNode } from "react";

import type { FileStats } from "@/utils/file-info";
import type { MdlsMetadata } from "@/utils/mdls";

interface FileMetadataProps {
  fileStats: FileStats | null;
  mdls: MdlsMetadata | null;
  exifSummary: Record<string, string> | null;
  colorAverage: string | null;
}

interface Preferences {
  showBasicInfo: boolean;
  showDates: boolean;
  showPermissions: boolean;
  showSpotlight: boolean;
  showImageDetails: boolean;
  showAudioVideo: boolean;
  showExif: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderBasicInfo(fileStats: FileStats): ReactNode {
  return (
    <>
      <Detail.Metadata.TagList title="File Info">
        <Detail.Metadata.TagList.Item
          text={fileStats.fileType}
          color={Color.Blue}
        />
      </Detail.Metadata.TagList>
      <Detail.Metadata.Label title="Name" text={fileStats.name} />
      <Detail.Metadata.Label
        title="Extension"
        text={fileStats.extension || "(none)"}
      />
      <Detail.Metadata.Label title="Size" text={fileStats.sizeFormatted} />
      <Detail.Metadata.Label title="Path" text={fileStats.path} />
      {fileStats.isDirectory && (
        <Detail.Metadata.Label title="Directory" text="Yes" />
      )}
      {fileStats.isSymlink && (
        <Detail.Metadata.Label title="Symlink" text="Yes" />
      )}
    </>
  );
}

function renderDates(fileStats: FileStats): ReactNode {
  return (
    <>
      <Detail.Metadata.Label title="Dates" icon={Icon.Calendar} text="" />
      <Detail.Metadata.Label
        title="Created"
        text={formatDate(fileStats.created)}
      />
      <Detail.Metadata.Label
        title="Modified"
        text={formatDate(fileStats.modified)}
      />
      <Detail.Metadata.Label
        title="Accessed"
        text={formatDate(fileStats.accessed)}
      />
    </>
  );
}

function renderPermissions(fileStats: FileStats): ReactNode {
  return (
    <>
      <Detail.Metadata.Label
        title="Permissions"
        icon={Icon.Lock}
        text={fileStats.permissions}
      />
      <Detail.Metadata.Label title="Owner UID" text={String(fileStats.uid)} />
      <Detail.Metadata.Label title="Group GID" text={String(fileStats.gid)} />
      <Detail.Metadata.Label title="Inode" text={String(fileStats.inode)} />
      <Detail.Metadata.Label
        title="Hard Links"
        text={String(fileStats.hardLinks)}
      />
    </>
  );
}

function renderSpotlight(mdls: MdlsMetadata): ReactNode {
  if (!mdls.contentType && !mdls.kind) return null;
  return (
    <>
      <Detail.Metadata.Label
        title="Spotlight"
        icon={Icon.MagnifyingGlass}
        text=""
      />
      {mdls.contentType && (
        <Detail.Metadata.Label title="Content Type" text={mdls.contentType} />
      )}
      {mdls.kind && <Detail.Metadata.Label title="Kind" text={mdls.kind} />}
      {mdls.displayName && (
        <Detail.Metadata.Label title="Display Name" text={mdls.displayName} />
      )}
      {mdls.creator && (
        <Detail.Metadata.Label title="Creator" text={mdls.creator} />
      )}
      {mdls.version && (
        <Detail.Metadata.Label title="Version" text={mdls.version} />
      )}
      {mdls.finderComment && (
        <Detail.Metadata.Label
          title="Finder Comment"
          text={mdls.finderComment}
        />
      )}
      {mdls.pageCount !== null && (
        <Detail.Metadata.Label title="Pages" text={String(mdls.pageCount)} />
      )}
      {mdls.authors && mdls.authors.length > 0 && (
        <Detail.Metadata.TagList title="Authors">
          {mdls.authors.map((author) => (
            <Detail.Metadata.TagList.Item
              key={author}
              text={author}
              color={Color.Purple}
            />
          ))}
        </Detail.Metadata.TagList>
      )}
      {mdls.whereFroms && mdls.whereFroms.length > 0 && (
        <Detail.Metadata.TagList title="Where From">
          {mdls.whereFroms.map((url) => (
            <Detail.Metadata.TagList.Item
              key={url}
              text={url}
              color={Color.Orange}
            />
          ))}
        </Detail.Metadata.TagList>
      )}
    </>
  );
}

function renderImageDetails(mdls: MdlsMetadata): ReactNode {
  if (mdls.pixelWidth === null || mdls.pixelHeight === null) return null;
  return (
    <>
      <Detail.Metadata.Label
        title="Image"
        icon={Icon.Image}
        text={`${mdls.pixelWidth} × ${mdls.pixelHeight}`}
      />
      {mdls.colorSpace && (
        <Detail.Metadata.Label title="Color Space" text={mdls.colorSpace} />
      )}
      {mdls.bitsPerSample !== null && (
        <Detail.Metadata.Label
          title="Bits Per Sample"
          text={String(mdls.bitsPerSample)}
        />
      )}
      {mdls.dpiWidth !== null && mdls.dpiHeight !== null && (
        <Detail.Metadata.Label
          title="DPI"
          text={`${mdls.dpiWidth} × ${mdls.dpiHeight}`}
        />
      )}
      {mdls.hasAlphaChannel !== null && (
        <Detail.Metadata.Label
          title="Has Alpha"
          text={mdls.hasAlphaChannel ? "Yes" : "No"}
        />
      )}
      {mdls.profileName && (
        <Detail.Metadata.Label title="Color Profile" text={mdls.profileName} />
      )}
    </>
  );
}

function renderAudioVideo(mdls: MdlsMetadata): ReactNode {
  if (mdls.durationSeconds === null) return null;
  return (
    <>
      <Detail.Metadata.Label
        title="Media"
        icon={Icon.Play}
        text={`${Math.floor(mdls.durationSeconds / 60)}m ${Math.floor(mdls.durationSeconds % 60)}s`}
      />
      {mdls.totalBitRate !== null && (
        <Detail.Metadata.Label
          title="Bit Rate"
          text={`${Math.round(mdls.totalBitRate / 1000)} kbps`}
        />
      )}
      {mdls.audioChannelCount !== null && (
        <Detail.Metadata.Label
          title="Audio Channels"
          text={String(mdls.audioChannelCount)}
        />
      )}
      {mdls.audioSampleRate !== null && (
        <Detail.Metadata.Label
          title="Sample Rate"
          text={`${mdls.audioSampleRate} Hz`}
        />
      )}
      {mdls.title && <Detail.Metadata.Label title="Title" text={mdls.title} />}
      {mdls.album && <Detail.Metadata.Label title="Album" text={mdls.album} />}
      {mdls.musicalGenre && (
        <Detail.Metadata.Label title="Genre" text={mdls.musicalGenre} />
      )}
      {mdls.composer && (
        <Detail.Metadata.Label title="Composer" text={mdls.composer} />
      )}
    </>
  );
}

function renderColorAverage(colorAverage: string): ReactNode {
  return (
    <Detail.Metadata.TagList title="Average Color">
      <Detail.Metadata.TagList.Item text={colorAverage} color={colorAverage} />
    </Detail.Metadata.TagList>
  );
}

function renderExif(exifSummary: Record<string, string>): ReactNode {
  const entries = Object.entries(exifSummary);
  if (entries.length === 0) return null;
  return (
    <>
      <Detail.Metadata.Label
        title="EXIF"
        icon={Icon.Camera}
        text={`${entries.length} fields`}
      />
      {entries.map(([key, value]) => (
        <Detail.Metadata.Label key={key} title={key} text={value} />
      ))}
    </>
  );
}

const FileMetadata: FC<FileMetadataProps> = ({
  fileStats,
  mdls,
  exifSummary,
  colorAverage,
}) => {
  if (!fileStats) return null;

  const prefs = getPreferenceValues<Preferences>();

  return (
    <Detail.Metadata>
      {prefs.showBasicInfo && renderBasicInfo(fileStats)}
      {prefs.showDates && renderDates(fileStats)}
      {prefs.showPermissions && renderPermissions(fileStats)}
      {prefs.showSpotlight && mdls && renderSpotlight(mdls)}
      {prefs.showImageDetails && mdls && renderImageDetails(mdls)}
      {prefs.showImageDetails &&
        colorAverage &&
        renderColorAverage(colorAverage)}
      {prefs.showAudioVideo && mdls && renderAudioVideo(mdls)}
      {prefs.showExif && exifSummary && renderExif(exifSummary)}
    </Detail.Metadata>
  );
};

export default FileMetadata;
