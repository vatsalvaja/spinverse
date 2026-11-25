"use strict";
/**
 * Minimal, dependency-free ZIP writer and reader for the Package Builder.
 *
 * Writer: deterministic (sorted entries, fixed timestamp, fixed attributes), so packaging the same build twice
 * produces byte-identical files. That is what lets the builder tell "already packaged" from "different content".
 * Reader: used to verify the finished archive (structure, sizes, CRC-32, unsafe paths) before it is accepted.
 *
 * Limits: no ZIP64 (a package is capped far below 4 GB), no encryption, no symlinks.
 */
const fs = require("fs");
const zlib = require("zlib");

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01, the ZIP epoch: keeps archives reproducible
const FLAG_UTF8 = 0x0800;
const MODE_FILE = 0o100644;
const MODE_TYPE_MASK = 0o170000;
const MODE_SYMLINK = 0o120000;

/** Already-compressed formats: deflating them wastes time for no gain. */
const STORE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".mp3", ".ogg", ".m4a", ".aac", ".mp4", ".webm", ".woff", ".woff2", ".zip", ".br", ".gz"]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const extOf = (name) => {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
};

/**
 * Writes `files` ({ name: "dir/file.ext", data: Buffer | absPath: string }) to `outFile`.
 * Names must already be safe, forward-slash, relative paths. Returns { entries, bytes }.
 */
function writeZip(files, outFile) {
  const sorted = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  if (sorted.length === 0) throw new Error("Refusing to write an empty ZIP.");
  if (sorted.length >= 0xffff) throw new Error(`Too many files for a ZIP without ZIP64 (${sorted.length}).`);

  const fd = fs.openSync(outFile, "w");
  const central = [];
  let offset = 0;
  const put = (buf) => {
    fs.writeSync(fd, buf, 0, buf.length);
    offset += buf.length;
  };

  try {
    for (const f of sorted) {
      const data = f.data ?? fs.readFileSync(f.absPath);
      if (data.length >= 0xffffffff) throw new Error(`"${f.name}" is too large for a ZIP without ZIP64.`);
      const name = Buffer.from(f.name, "utf8");
      const crc = crc32(data);

      let method = 0;
      let body = data;
      if (data.length > 0 && !STORE_EXT.has(extOf(f.name))) {
        const deflated = zlib.deflateRawSync(data, { level: 9 });
        if (deflated.length < data.length) {
          method = 8;
          body = deflated;
        }
      }

      const local = Buffer.alloc(30);
      local.writeUInt32LE(SIG_LOCAL, 0);
      local.writeUInt16LE(20, 4); // version needed
      local.writeUInt16LE(FLAG_UTF8, 6);
      local.writeUInt16LE(method, 8);
      local.writeUInt16LE(DOS_TIME, 10);
      local.writeUInt16LE(DOS_DATE, 12);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(body.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(name.length, 26);
      local.writeUInt16LE(0, 28);

      const headerOffset = offset;
      put(local);
      put(name);
      put(body);
      central.push({ name, crc, method, csize: body.length, usize: data.length, headerOffset });
    }

    const cdStart = offset;
    for (const c of central) {
      const h = Buffer.alloc(46);
      h.writeUInt32LE(SIG_CENTRAL, 0);
      h.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, spec 2.0
      h.writeUInt16LE(20, 6);
      h.writeUInt16LE(FLAG_UTF8, 8);
      h.writeUInt16LE(c.method, 10);
      h.writeUInt16LE(DOS_TIME, 12);
      h.writeUInt16LE(DOS_DATE, 14);
      h.writeUInt32LE(c.crc, 16);
      h.writeUInt32LE(c.csize, 20);
      h.writeUInt32LE(c.usize, 24);
      h.writeUInt16LE(c.name.length, 28);
      h.writeUInt16LE(0, 30); // extra
      h.writeUInt16LE(0, 32); // comment
      h.writeUInt16LE(0, 34); // disk
      h.writeUInt16LE(0, 36); // internal attrs
      h.writeUInt32LE((MODE_FILE << 16) >>> 0, 38);
      h.writeUInt32LE(c.headerOffset, 42);
      put(h);
      put(c.name);
    }
    const cdSize = offset - cdStart;

    const end = Buffer.alloc(22);
    end.writeUInt32LE(SIG_EOCD, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(central.length, 8);
    end.writeUInt16LE(central.length, 10);
    end.writeUInt32LE(cdSize, 12);
    end.writeUInt32LE(cdStart, 16);
    end.writeUInt16LE(0, 20);
    put(end);
  } finally {
    fs.closeSync(fd);
  }
  return { entries: central.length, bytes: offset };
}

/**
 * Reads and fully verifies an archive. Never throws for a bad archive: problems are returned in `errors`.
 * Returns { errors, entries: [{ path, size, read() }] }. `read()` returns the verified, inflated bytes.
 */
function readZip(file) {
  const errors = [];
  const entries = [];
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch (e) {
    return { errors: [`Cannot read the archive: ${e.message}`], entries };
  }
  if (buf.length < 22 || buf.readUInt32LE(0) !== SIG_LOCAL) {
    return { errors: ["Not a ZIP archive: missing the ZIP signature."], entries };
  }

  // end-of-central-directory record: scan backwards (it may be followed by a comment of up to 64 KB)
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return { errors: ["The archive is truncated or corrupt: no end-of-central-directory record."], entries };

  const count = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) return { errors: ["ZIP64 archives are not supported."], entries };
  if (cdOffset + cdSize > eocd) return { errors: ["The central directory points outside the archive."], entries };

  const seen = new Set();
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== SIG_CENTRAL) {
      errors.push(`Central directory entry ${n + 1} is damaged.`);
      break;
    }
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const attrs = buf.readUInt32LE(p + 38) >>> 16;
    const headerOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue; // directory marker
    if (seen.has(name)) errors.push(`Duplicate entry "${name}".`);
    seen.add(name);
    if (flags & 1) { errors.push(`"${name}" is encrypted.`); continue; }
    if ((attrs & MODE_TYPE_MASK) === MODE_SYMLINK) { errors.push(`"${name}" is a symbolic link.`); continue; }
    if (method !== 0 && method !== 8) { errors.push(`"${name}" uses unsupported compression method ${method}.`); continue; }
    if (headerOffset + 30 > buf.length || buf.readUInt32LE(headerOffset) !== SIG_LOCAL) { errors.push(`"${name}": local header is damaged.`); continue; }

    const dataStart = headerOffset + 30 + buf.readUInt16LE(headerOffset + 26) + buf.readUInt16LE(headerOffset + 28);
    if (dataStart + csize > cdOffset) { errors.push(`"${name}": data runs past the central directory.`); continue; }

    let data;
    try {
      const raw = buf.subarray(dataStart, dataStart + csize);
      data = method === 8 ? zlib.inflateRawSync(raw) : Buffer.from(raw);
    } catch (e) {
      errors.push(`"${name}": cannot decompress (${e.message}).`);
      continue;
    }
    if (data.length !== usize) { errors.push(`"${name}": size mismatch (expected ${usize} bytes, got ${data.length}).`); continue; }
    if (crc32(data) !== crc) { errors.push(`"${name}": CRC-32 mismatch, the data is corrupt.`); continue; }
    entries.push({ path: name, size: usize, read: () => data });
  }
  return { errors, entries };
}

module.exports = { writeZip, readZip, crc32 };
