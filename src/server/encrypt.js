const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = 'b0041c96c79f11e9bd2928d2446ae99a';
const iv = 'c84f39986c79fl11';

function encrypt(text) {
 let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
 let encrypted = cipher.update(text);
 encrypted = Buffer.concat([encrypted, cipher.final()]);
 return encrypted.toString('hex');
}

function decrypt(text) {
 let encryptedText = Buffer.from(text, 'hex');
 let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
 let decrypted = decipher.update(encryptedText);
 decrypted = Buffer.concat([decrypted, decipher.final()]);
 return decrypted.toString();
}

module.exports = { encrypt, decrypt };
