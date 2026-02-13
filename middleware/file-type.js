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
    'audio/mpeg': ['audio/opus', 'audio/mp3'],
    'audio/mp3': ['audio/mpeg', 'audio/opus'],
    'audio/opus': ['audio/mpeg', 'audio/mp3'],
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

async function verifyFileContent(buffer, mimetype) {
  if (!buffer) throw new Error("No file provided");

  try {
    const fileType = await FileType.fromBuffer(buffer);

    // If FileType couldn't detect the file type (returns null/undefined)
    if (!fileType) {
      // For text-based MIME types, accept the declared mimetype since FileType can't detect them
      if (mimetype && TEXT_MIME_TYPES.includes(mimetype)) {
        // Optionally verify that the content is valid UTF-8 text
        try {
          buffer.toString('utf8');
          return true;
        } catch (e) {
          const err = new Error(`File content is not valid text for mimetype: ${mimetype}`);
          err.source = "FileContentVerification";
          throw err;
        }
      } else if (mimetype && mimetype.startsWith('image/svg')) {
        // Handle SVG files (can be image/svg+xml or variants)
        try {
          buffer.toString('utf8');
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
