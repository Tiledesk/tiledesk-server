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

    // If FileType detected a type, it must match the declared mimetype
    if (mimetype && fileType.mime !== mimetype) {
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
