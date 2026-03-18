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

  try {
    const fileType = await FileType.fromBuffer(buf);

    // If FileType couldn't detect the file type (returns null/undefined)
    if (!fileType) {
      // For text-based MIME types, accept the declared mimetype since FileType can't detect them
      if (mimetype && TEXT_MIME_TYPES.includes(mimetype)) {
        // Optionally verify that the content is valid UTF-8 text
        try {
          buf.toString('utf8');
          return true;
        } catch (e) {
          const err = new Error(`File content is not valid text for mimetype: ${mimetype}`);
          err.source = "FileContentVerification";
          throw err;
        }
      } else if (mimetype && mimetype.startsWith('image/svg')) {
        // Handle SVG files (can be image/svg+xml or variants)
        try {
          buf.toString('utf8');
          return true;
        } catch (e) {
          const err = new Error(`File content is not valid text for mimetype: ${mimetype}`);
          err.source = "FileContentVerification";
          throw err;
        }
      } else {
        // For non-text files, FileType should be able to detect them
        const err = new Error(`File content does not match mimetype. Detected: unknown, provided: ${mimetype}`);
        err.source = "FileContentVerification";
        throw err;
      }
    }

    // If FileType detected a type, it must match the declared mimetype (or be equivalent)
    if (mimetype && !areMimeTypesEquivalent(fileType.mime, mimetype)) {
        const err = new Error(`File content does not match mimetype. Detected: ${fileType.mime}, provided: ${mimetype}`);
        err.source = "FileContentVerification";
        throw err;
    }

    return true;
  } catch (err) {
    throw err;
  }
}

module.exports = verifyFileContent;
