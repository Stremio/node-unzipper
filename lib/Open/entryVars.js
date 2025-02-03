var binary = require('binary');
var parseExtraField = require('../parseExtraField');
var parseDateTime = require('../parseDateTime');

module.exports = function (file, entry, directoryVars) {
  return file.pull(30)
  .then(function(data) {
    var vars = binary.parse(data)
      .word32lu('signature')
      .word16lu('versionsNeededToExtract')
      .word16lu('flags')
      .word16lu('compressionMethod')
      .word16lu('lastModifiedTime')
      .word16lu('lastModifiedDate')
      .word32lu('crc32')
      .word32lu('compressedSize')
      .word32lu('uncompressedSize')
      .word16lu('fileNameLength')
      .word16lu('extraFieldLength')
      .vars;

    vars.lastModifiedDateTime = parseDateTime(vars.lastModifiedDate, vars.lastModifiedTime);

    return file.pull(vars.fileNameLength)
      .then(function(fileName) {
        vars.fileName = fileName.toString('utf8');
        return file.pull(vars.extraFieldLength);
      })
      .then(function(extraField) {
        var checkEncryption;
        vars.extra = parseExtraField(extraField, vars);
        // Ignore logal file header vars if the directory vars are available
        if (directoryVars && directoryVars.compressedSize) vars = directoryVars;

        if (vars.flags & 0x01) checkEncryption = file.pull(12)
          .then(function(header) {
            if (!_password)
              throw new Error('MISSING_PASSWORD');

            var decrypt = Decrypt();

            String(_password).split('').forEach(function(d) {
              decrypt.update(d);
            });

            for (var i=0; i < header.length; i++)
              header[i] = decrypt.decryptByte(header[i]);

            vars.decrypt = decrypt;
            vars.compressedSize -= 12;

            var check = (vars.flags & 0x8) ? (vars.lastModifiedTime >> 8) & 0xff : (vars.crc32 >> 24) & 0xff;
            if (header[11] !== check)
              throw new Error('BAD_PASSWORD');

            return vars;
          });

        return Promise.resolve(checkEncryption)
          .then(function() {
            if (entry)
              entry.emit('vars',vars);
            return vars;
          });
      });
  });
}
