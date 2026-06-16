import assert from "node:assert/strict";
import test from "node:test";
import { extractMediaDimensions } from "./media-metadata";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2kQAAAAASUVORK5CYII=";


const JPEG_1X1_BUFFER = Buffer.from([
  0xff, 0xd8,
  0xff, 0xe0, 0x00, 0x10,
  0x4a, 0x46, 0x49, 0x46, 0x00,
  0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xff, 0xc0, 0x00, 0x11,
  0x08, 0x00, 0x01, 0x00, 0x01, 0x03,
  0x01, 0x11, 0x00,
  0x02, 0x11, 0x01,
  0x03, 0x11, 0x01,
  0xff, 0xd9,
]);

test("extractMediaDimensions reads PNG dimensions", async () => {
  const file = new File(
    [Buffer.from(PNG_1X1_BASE64, "base64")],
    "pixel.png",
    { type: "image/png" },
  );

  const dimensions = await extractMediaDimensions(file);

  assert.deepEqual(dimensions, {
    width: 1,
    height: 1,
  });
});

test("extractMediaDimensions reads JPEG dimensions", async () => {
  const file = new File(
    [JPEG_1X1_BUFFER],
    "pixel.jpg",
    { type: "image/jpeg" },
  );

  const dimensions = await extractMediaDimensions(file);

  assert.deepEqual(dimensions, {
    width: 1,
    height: 1,
  });
});

test("extractMediaDimensions returns null dimensions for non-images", async () => {
  const file = new File(["demo"], "notes.txt", { type: "text/plain" });

  const dimensions = await extractMediaDimensions(file);

  assert.deepEqual(dimensions, {
    width: null,
    height: null,
  });
});
