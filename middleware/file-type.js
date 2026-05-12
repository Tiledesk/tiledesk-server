const FileType = require('file-type');
const fs = require('fs');

// List of text-based MIME types that FileType cannot detect (they don't have binary signatures)
const TEXT_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'image/svg+xml',
  'application/xml',
  'text/xml'
];

/**
 * Checks if two MIME types are equivalent, accepting common aliases
 * Examples:
 * - audio/wav === audio/wave === audio/vnd.wave
 * - image/jpeg === image/jpg
 */
function areMimeTypesEquivalent(mimeType1, mimeType2) {
  if (!mimeType1 || !mimeType2) return false;
  if (mimeType1 === mimeType2) return true;
  
  // Normalize to lowercase for comparison
  const m1 = mimeType1.toLowerCase();
  const m2 = mimeType2.toLowerCase();
  if (m1 === m2) return true;
  
  // Common MIME type aliases
  const aliases = {
    'audio/wav': ['audio/wave', 'audio/x-wav', 'audio/vnd.wave'],
    'audio/wave': ['audio/wav', 'audio/x-wav', 'audio/vnd.wave'],
    'audio/x-wav': ['audio/wav', 'audio/wave', 'audio/vnd.wave'],
    'audio/vnd.wave': ['audio/wav', 'audio/wave', 'audio/x-wav'],
    'audio/mpeg': ['audio/opus', 'audio/mp3', 'audio/webm'],
    'audio/mp3': ['audio/mpeg', 'audio/opus', 'audio/webm'],
    'audio/opus': ['audio/mpeg', 'audio/mp3', 'audio/webm'],
    'audio/webm': ['audio/mpeg', 'audio/mp3', 'audio/opus'],
    'image/jpeg': ['image/jpg'],
    'image/jpg': ['image/jpeg'],
    'application/x-zip-compressed': ['application/zip'],
    'application/zip': ['application/x-zip-compressed'],
  };
  
  // Check if m1 is an alias of m2 or vice versa
  if (aliases[m1] && aliases[m1].includes(m2)) return true;
  if (aliases[m2] && aliases[m2].includes(m1)) return true;
  
  return false;
}

// Magic bytes for fallback when file-type throws (e.g. strtok3/token-types Uint8Array vs Buffer)
const MAGIC_SIGNATURES = {
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],           // EBML
  'audio/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
  'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // ID3 or MP3 frame
  'audio/mp3': [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

function magicMatches(buf, mimetype) {
  const signatures = MAGIC_SIGNATURES[mimetype && mimetype.toLowerCase()];
  if (!signatures) return false;
  for (const sig of signatures) {
    if (buf.length < sig.length) continue;
    let ok = true;
    for (let i = 0; i < sig.length; i++) {
      const b = buf[i] !== undefined ? (buf[i] & 0xFF) : -1;
      if (b !== sig[i]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/;

/**
 * Ensures the input is a Node.js Buffer. file-type (and token-types/strtok3) require
 * a Buffer with methods like readUInt8; GridFS or other sources may return
 * Uint8Array, ArrayBuffer, BSON Binary, or (when client sends base64) a string.
 * We always allocate a new Buffer and copy bytes so file-type never receives
 * a buffer-like that loses readUInt8 when sliced (e.g. by strtok3).
 */
function ensureBuffer(buffer) {
  if (!buffer) return buffer;

  // Base64 string (e.g. client sends form body as base64): decode to binary
  if (typeof buffer === 'string' && buffer.length > 0) {
    const trimmed = buffer.replace(/\s/g, '');
    if (BASE64_REGEX.test(trimmed)) {
      return Buffer.from(trimmed, 'base64');
    }
    return Buffer.from(buffer, 'utf8');
  }

  // Copy into a new Buffer so file-type's internal slices are always real Buffers
  let uint8;
  if (buffer instanceof Uint8Array) {
    uint8 = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    uint8 = new Uint8Array(buffer);
  } else if (buffer && typeof buffer.buffer === 'object' && buffer.buffer instanceof ArrayBuffer) {
    uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (Buffer.isBuffer(buffer)) {
    uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else {
    uint8 = new Uint8Array(Buffer.from(buffer));
  }
  return Buffer.from(uint8);
}

async function verifyFileContent(buffer, mimetype) {
  if (!buffer) throw new Error("No file provided");

  const buf = ensureBuffer(buffer);

  let fileType;
  try {
    fileType = await FileType.fromBuffer(buf);
  } catch (err) {
    // strtok3 uses Uint8Array for numBuffer but token-types expects Buffer.readUInt8 (known compat bug in deps)
    if (err && typeof err.message === 'string' && err.message.includes('readUInt8')) {
      if (mimetype && magicMatches(buf, mimetype)) return true;
      const err2 = new Error(`File content could not be verified. Declared mimetype: ${mimetype}`);
      err2.source = "FileContentVerification";
      throw err2;
    }
    throw err;
  }

  // If FileType couldn't detect the file type (returns null/undefined)
  if (!fileType) {
    // For text-based MIME types, accept the declared mimetype since FileType can't detect them
    if (mimetype && TEXT_MIME_TYPES.includes(mimetype)) {
      try {
        buf.toString('utf8');
        return true;
      } catch (e) {
        const err = new Error(`File content is not valid text for mimetype: ${mimetype}`);
        err.source = "FileContentVerification";
        throw err;
      }
    }
    if (mimetype && mimetype.startsWith('image/svg')) {
      try {
        buf.toString('utf8');
        return true;
      } catch (e) {
        const err = new Error(`File content is not valid text for mimetype: ${mimetype}`);
        err.source = "FileContentVerification";
        throw err;
      }
    }
    if (mimetype && magicMatches(buf, mimetype)) return true;
    const err = new Error(`File content does not match mimetype. Detected: unknown, provided: ${mimetype}`);
    err.source = "FileContentVerification";
    throw err;
  }

  // If FileType detected a type, it must match the declared mimetype (or be equivalent)
  if (mimetype && !areMimeTypesEquivalent(fileType.mime, mimetype)) {
    const err = new Error(`File content does not match mimetype. Detected: ${fileType.mime}, provided: ${mimetype}`);
    err.source = "FileContentVerification";
    throw err;
  }

  return true;
}

module.exports = verifyFileContent;
