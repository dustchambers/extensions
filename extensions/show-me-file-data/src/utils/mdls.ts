import { execSync } from "node:child_process";

export interface MdlsMetadata {
  contentType: string | null;
  contentTypeTree: string[] | null;
  displayName: string | null;
  kind: string | null;
  pixelHeight: number | null;
  pixelWidth: number | null;
  colorSpace: string | null;
  bitsPerSample: number | null;
  dpiHeight: number | null;
  dpiWidth: number | null;
  hasAlphaChannel: boolean | null;
  profileName: string | null;
  authors: string[] | null;
  creator: string | null;
  encodingApplications: string[] | null;
  whereFroms: string[] | null;
  finderComment: string | null;
  durationSeconds: number | null;
  totalBitRate: number | null;
  audioBitRate: number | null;
  audioChannelCount: number | null;
  audioSampleRate: number | null;
  title: string | null;
  album: string | null;
  musicalGenre: string | null;
  composer: string | null;
  pageCount: number | null;
  securityMethod: string | null;
  version: string | null;
  raw: Record<string, string>;
}

function parseValue(
  value: string,
): string | number | boolean | string[] | null {
  const trimmed = value.trim();

  if (trimmed === "(null)") return null;

  // Array value: starts with ( and ends with )
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((item) => item.trim().replace(/^"(.*)"$/, "$1"))
      .filter((item) => item.length > 0);
  }

  // Quoted string
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Boolean
  if (trimmed === "1" || trimmed === "yes") return true;
  if (trimmed === "0" || trimmed === "no") return false;

  return trimmed;
}

function parseMdlsOutput(
  output: string,
): Record<string, string | number | boolean | string[] | null> {
  const result: Record<string, string | number | boolean | string[] | null> =
    {};
  const lines = output.split("\n");

  let currentKey = "";
  let currentValue = "";
  let inArray = false;

  for (const line of lines) {
    if (inArray) {
      currentValue += "\n" + line;
      if (line.trim().endsWith(")")) {
        inArray = false;
        result[currentKey] = parseValue(currentValue);
      }
      continue;
    }

    const match = line.match(/^(\S+)\s+=\s+(.*)/);
    if (match) {
      currentKey = match[1];
      currentValue = match[2];

      if (
        currentValue.trim().startsWith("(") &&
        !currentValue.trim().endsWith(")")
      ) {
        inArray = true;
        continue;
      }

      result[currentKey] = parseValue(currentValue);
    }
  }

  return result;
}

export async function getMdlsMetadata(filePath: string): Promise<MdlsMetadata> {
  let output: string;
  try {
    output = execSync(`mdls ${JSON.stringify(filePath)}`, {
      encoding: "utf-8",
      timeout: 5000,
    });
  } catch {
    return {
      contentType: null,
      contentTypeTree: null,
      displayName: null,
      kind: null,
      pixelHeight: null,
      pixelWidth: null,
      colorSpace: null,
      bitsPerSample: null,
      dpiHeight: null,
      dpiWidth: null,
      hasAlphaChannel: null,
      profileName: null,
      authors: null,
      creator: null,
      encodingApplications: null,
      whereFroms: null,
      finderComment: null,
      durationSeconds: null,
      totalBitRate: null,
      audioBitRate: null,
      audioChannelCount: null,
      audioSampleRate: null,
      title: null,
      album: null,
      musicalGenre: null,
      composer: null,
      pageCount: null,
      securityMethod: null,
      version: null,
      raw: {},
    };
  }

  const parsed = parseMdlsOutput(output);

  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== null) {
      const shortKey = key.replace(/^kMDItem/, "");
      raw[shortKey] = Array.isArray(value) ? value.join(", ") : String(value);
    }
  }

  return {
    contentType: (parsed.kMDItemContentType as string) ?? null,
    contentTypeTree: (parsed.kMDItemContentTypeTree as string[]) ?? null,
    displayName: (parsed.kMDItemDisplayName as string) ?? null,
    kind: (parsed.kMDItemKind as string) ?? null,
    pixelHeight: (parsed.kMDItemPixelHeight as number) ?? null,
    pixelWidth: (parsed.kMDItemPixelWidth as number) ?? null,
    colorSpace: (parsed.kMDItemColorSpace as string) ?? null,
    bitsPerSample: (parsed.kMDItemBitsPerSample as number) ?? null,
    dpiHeight: (parsed.kMDItemDPIHeight as number) ?? null,
    dpiWidth: (parsed.kMDItemDPIWidth as number) ?? null,
    hasAlphaChannel: (parsed.kMDItemHasAlphaChannel as boolean) ?? null,
    profileName: (parsed.kMDItemProfileName as string) ?? null,
    authors: (parsed.kMDItemAuthors as string[]) ?? null,
    creator: (parsed.kMDItemCreator as string) ?? null,
    encodingApplications:
      (parsed.kMDItemEncodingApplications as string[]) ?? null,
    whereFroms: (parsed.kMDItemWhereFroms as string[]) ?? null,
    finderComment: (parsed.kMDItemFinderComment as string) ?? null,
    durationSeconds: (parsed.kMDItemDurationSeconds as number) ?? null,
    totalBitRate: (parsed.kMDItemTotalBitRate as number) ?? null,
    audioBitRate: (parsed.kMDItemAudioBitRate as number) ?? null,
    audioChannelCount: (parsed.kMDItemAudioChannelCount as number) ?? null,
    audioSampleRate: (parsed.kMDItemAudioSampleRate as number) ?? null,
    title: (parsed.kMDItemTitle as string) ?? null,
    album: (parsed.kMDItemAlbum as string) ?? null,
    musicalGenre: (parsed.kMDItemMusicalGenre as string) ?? null,
    composer: (parsed.kMDItemComposer as string) ?? null,
    pageCount: (parsed.kMDItemNumberOfPages as number) ?? null,
    securityMethod: (parsed.kMDItemSecurityMethod as string) ?? null,
    version: (parsed.kMDItemVersion as string) ?? null,
    raw,
  };
}
