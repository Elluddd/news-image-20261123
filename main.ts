// Entry program for the make.fun news-image-20261123 bounty.
// Reads the front-page image shipped beside this file and writes it to the
// output directory the harness provides. Node 22, standard library only,
// no network, fully deterministic: the same input bytes come out every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

const bytes = readFileSync(source);
if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error("entry.png is not a PNG file");
}
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}

// The first chunk must be IHDR; its first 8 data bytes are the image width
// and height as big-endian uint32s. The bounty caps the image at 1024x1024.
const ihdrLength = bytes.readUInt32BE(8);
const ihdrType = bytes.subarray(12, 16).toString("latin1");
if (ihdrLength !== 13 || ihdrType !== "IHDR") {
  throw new Error("entry.png has no IHDR chunk first");
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(target, bytes);
console.log(`wrote ${target} (${bytes.length} bytes)`);
