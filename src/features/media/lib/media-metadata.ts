export type MediaDimensions = {
  width: number | null;
  height: number | null;
};

const PNG_SIGNATURE = Buffer.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
]);

const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8]);

function readPngDimensions(buffer: Buffer): MediaDimensions | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): MediaDimensions | null {
  if (buffer.length < 4 || !buffer.subarray(0, 2).equals(JPEG_SIGNATURE)) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd8 || marker === 0xd9) {
      continue;
    }

    if (offset + 2 > buffer.length) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      if (offset + 7 > buffer.length) {
        return null;
      }

      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

export async function extractMediaDimensions(file: File): Promise<MediaDimensions> {
  if (!file.type.startsWith("image/")) {
    return {
      width: null,
      height: null,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const pngDimensions = readPngDimensions(buffer);
  if (pngDimensions) {
    return pngDimensions;
  }

  const jpegDimensions = readJpegDimensions(buffer);
  if (jpegDimensions) {
    return jpegDimensions;
  }

  return {
    width: null,
    height: null,
  };
}
