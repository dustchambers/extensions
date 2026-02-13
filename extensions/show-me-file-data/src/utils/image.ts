import ExifReader from "exifreader";
import type { Tags } from "exifreader";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  latitudeRef: string;
  longitudeRef: string;
}

export interface GpsLinks {
  appleMaps: string;
  googleMaps: string;
  openStreetMap: string;
  bingMaps: string;
}

export async function getExifData(filePath: string): Promise<Tags | null> {
  try {
    const buffer = await fs.readFile(filePath);
    const tags = ExifReader.load(buffer, { includeUnknown: true });
    return tags;
  } catch {
    return null;
  }
}

export function getGpsCoordinates(tags: Tags): GpsCoordinates | null {
  if (
    !tags.GPSLatitude ||
    !tags.GPSLongitude ||
    !tags.GPSLatitudeRef ||
    !tags.GPSLongitudeRef
  ) {
    return null;
  }

  const latRef = (tags.GPSLatitudeRef.value as string[])[0];
  const lonRef = (tags.GPSLongitudeRef.value as string[])[0];
  const lat = parseFloat(tags.GPSLatitude.description);
  const lon = parseFloat(tags.GPSLongitude.description);

  if (isNaN(lat) || isNaN(lon)) return null;

  return {
    latitude: latRef === "S" ? -lat : lat,
    longitude: lonRef === "W" ? -lon : lon,
    latitudeRef: latRef,
    longitudeRef: lonRef,
  };
}

export function buildGpsLinks(coords: GpsCoordinates): GpsLinks {
  const { latitude, longitude } = coords;

  return {
    appleMaps: `https://maps.apple.com/?ll=${latitude},${longitude}&z=18`,
    googleMaps: `https://maps.google.com/maps?f=q&q=loc:${latitude},${longitude}&t=k&spn=0.5,0.5`,
    openStreetMap: `https://www.openstreetmap.org/#map=20/${latitude}/${longitude}`,
    bingMaps: `https://www.bing.com/maps/?v=2&cp=${latitude}~${longitude}&lvl=18.0&sty=c`,
  };
}

export function getImageColorAverage(filePath: string): string | null {
  try {
    // Use sips to get image properties, then use a Python one-liner to compute average color
    const result = execSync(
      `python3 -c "
from PIL import Image
import sys
try:
    img = Image.open(sys.argv[1]).convert('RGB')
    img.thumbnail((50, 50))
    pixels = list(img.getdata())
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    print(f'#{r:02x}{g:02x}{b:02x}')
except:
    print('')
" ${JSON.stringify(filePath)}`,
      { encoding: "utf-8", timeout: 10000 },
    ).trim();

    return result && result.startsWith("#") ? result : null;
  } catch {
    // Fallback: try using sips getProperty
    try {
      const sipsOutput = execSync(
        `sips -g space -g samplesPerPixel ${JSON.stringify(filePath)}`,
        {
          encoding: "utf-8",
          timeout: 5000,
        },
      );
      // Just return null if we can't compute - this is a nice-to-have
      void sipsOutput;
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Clean up a raw EXIF description value based on which field it belongs to.
 * Trims whitespace and normalises common verbose formats produced by exifreader.
 */
function cleanExifValue(tagKey: string, raw: string): string {
  const value = raw.trim();
  if (!value) return value;

  switch (tagKey) {
    case "ExposureTime": {
      // "1/250 sec" or "1/250 sec." -> "1/250"
      const expMatch = value.match(/^(\d+\/\d+)/);
      return expMatch ? expMatch[1] : value.replace(/\s*sec\.?$/i, "").trim();
    }
    case "FocalLength": {
      // "50 mm" or "50.0 mm" or "50.0mm" -> "50mm"
      const flMatch = value.match(/([\d.]+)\s*mm/i);
      if (flMatch) {
        const num = parseFloat(flMatch[1]);
        return Number.isInteger(num) ? `${num}mm` : `${num}mm`;
      }
      return value;
    }
    case "FNumber": {
      // "f/2.8" already good; "F2.8" or "2.8" -> "f/2.8"
      const fnMatch = value.match(/f?\/?(\d+\.?\d*)/i);
      return fnMatch ? `f/${fnMatch[1]}` : value;
    }
    case "ISOSpeedRatings": {
      // "ISO 400" or "400" -> "400"
      const isoMatch = value.match(/(\d+)/);
      return isoMatch ? isoMatch[1] : value;
    }
    default:
      return value;
  }
}

export function buildExifSummary(tags: Tags): Record<string, string> {
  const summary: Record<string, string> = {};

  const fields: [string, string][] = [
    ["Make", "Camera Make"],
    ["Model", "Camera Model"],
    ["LensModel", "Lens"],
    ["ExposureTime", "Exposure"],
    ["FNumber", "Aperture"],
    ["ISOSpeedRatings", "ISO"],
    ["FocalLength", "Focal Length"],
    ["Flash", "Flash"],
    ["WhiteBalance", "White Balance"],
    ["MeteringMode", "Metering Mode"],
    ["ExposureProgram", "Exposure Program"],
    ["ExposureMode", "Exposure Mode"],
    ["ColorSpace", "Color Space"],
    ["ImageWidth", "Width"],
    ["ImageHeight", "Height"],
    ["Orientation", "Orientation"],
    ["Software", "Software"],
    ["DateTime", "Date/Time"],
    ["DateTimeOriginal", "Date/Time Original"],
  ];

  for (const [tagKey, label] of fields) {
    const tag = tags[tagKey];
    if (tag && tag.description != null) {
      const desc =
        typeof tag.description === "string"
          ? tag.description
          : String(tag.description);
      const cleaned = cleanExifValue(tagKey, desc);
      if (cleaned) {
        summary[label] = cleaned;
      }
    }
  }

  return summary;
}
