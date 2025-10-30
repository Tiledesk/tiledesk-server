const { expect } = require('chai');
const path = require('path');
const mime = require('mime-types');
let log = false;

describe('File Filter Tests', () => {
  
  // Simula la funzione getMimeTypes del tuo codice
  function getMimeTypes(allowed_extension) {
    const extension = allowed_extension.split(',').map(e => e.trim().toLowerCase());
    const allowedMimeTypes = extension.map(ext => mime.lookup(ext)).filter(Boolean);
    return allowedMimeTypes;
  }

  // Simula il fileFilter
  const createFileFilter = (extensionsSource = 'default') => {
    return (req, file, cb) => {
      const default_allowed_extensions = ".jpg,.jpeg,.png,.gif,.pdf,.txt";
      const assets_allowed_extensions = ".jpg,.jpeg,.png,.gif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx";
      
      let allowed_extensions;
      let allowed_mime_types;

      if (extensionsSource === 'assets') {
        allowed_extensions = assets_allowed_extensions;
      } else {
        allowed_extensions = default_allowed_extensions;
      }

      if (allowed_extensions !== "*/*") {
        allowed_mime_types = getMimeTypes(allowed_extensions);
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowed_extensions.includes(ext)) {
          const error = new Error("Extension not allowed");
          error.status = 403;
          return cb(error);
        }

        const expectedMimetype = mime.lookup(ext);
        if (expectedMimetype && file.mimetype !== expectedMimetype) {
            const error = new Error("Mimetype mismatch detected");
            error.status = 403;
            return cb(error);
        }
        
        return cb(null, true);
      } else {
        return cb(null, true);
      }
    }
  };

  describe('getMimeTypes', () => {
    it('should convert extensions to mime types', () => {
      const result = getMimeTypes('.pdf,.png,.jpg');
      if (log) { console.log('Mime types result:', result) };
      expect(result).to.include('application/pdf');
      expect(result).to.include('image/png');
      expect(result).to.include('image/jpeg');
    });

    it('should handle extensions without dot', () => {
      const result = getMimeTypes('pdf,png');
      if (log) { console.log('Mime types without dot:', result) };
      expect(result).to.have.lengthOf(2); // mime.lookup('pdf') returns false
    });
  });

  describe('FileFilter - Extension Check', () => {
    it('should reject file with disallowed extension', (done) => {
      const fileFilter = createFileFilter('default');
      const mockReq = {};
      const mockFile = {
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload'
      };

      fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).to.exist;
        expect(error.message).to.equal('Extension not allowed');
        expect(error.status).to.equal(403);
        done();
      });
    });

    it('should accept file with allowed extension', (done) => {
      const fileFilter = createFileFilter('default');
      const mockReq = {};
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf'
      };

      fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('FileFilter - Mimetype Check', () => {
    it('should reject PNG file with PDF mimetype (mismatch)', (done) => {
        const fileFilter = createFileFilter('default');
        const mockReq = {};
        const mockFile = {
          originalname: 'image.png',
          mimetype: 'application/pdf'
        };
      
        // DEBUG: aggiungi questo
        const default_allowed_extensions = ".jpg,.jpeg,.png,.gif,.pdf,.txt";
        const allowed_mime_types = getMimeTypes(default_allowed_extensions);
        if (log) { console.log('Allowed extensions:', default_allowed_extensions) };
        if (log) { console.log('Allowed mime types:', allowed_mime_types) };
        if (log) { console.log('File mimetype:', mockFile.mimetype) };
        if (log) { console.log('Includes check:', allowed_mime_types.includes(mockFile.mimetype)) };
      
        fileFilter(mockReq, mockFile, (error, result) => {
          if (log) { console.log('Error:', error) };
          if (log) { console.log('Result:', result) };
          expect(error).to.exist;
          expect(error.message).to.equal('Mimetype mismatch detected');
          expect(error.status).to.equal(403);
          done();
        });
      });

    it('should reject PDF file with HTML mimetype (mismatch)', (done) => {
      const fileFilter = createFileFilter('default');
      const mockReq = {};
      const mockFile = {
        originalname: 'document.pdf',
        mimetype: 'text/html'
      };

      fileFilter(mockReq, mockFile, (error, result) => {
        if (log) { console.log('Error:', error) };
        if (log) { console.log('Result:', result) };
        expect(error).to.exist;
        expect(error.message).to.equal('Mimetype mismatch detected');
        done();
      });
    });

    it('should accept matching extension and mimetype', (done) => {
      const fileFilter = createFileFilter('default');
      const mockReq = {};
      const mockFile = {
        originalname: 'image.png',
        mimetype: 'image/png'
      };

      fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('FileFilter - Assets Route', () => {
    it('should accept CSV files on assets route', (done) => {
      const fileFilter = createFileFilter('assets');
      const mockReq = {};
      const mockFile = {
        originalname: 'data.csv',
        mimetype: 'text/csv'
      };

      fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should reject CSV files on chat route', (done) => {
      const fileFilter = createFileFilter('default');
      const mockReq = {};
      const mockFile = {
        originalname: 'data.csv',
        mimetype: 'text/csv'
      };

      fileFilter(mockReq, mockFile, (error, result) => {
        expect(error).to.exist;
        expect(error.message).to.equal('Extension not allowed');
        done();
      });
    });
  });
});