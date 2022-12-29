const crypto = require('crypto');

function encrypt(text, key) {
    const nonce = Buffer.from(crypto.randomBytes(12), 'hex');

    let cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    encrypted += Buffer.from(cipher.getAuthTag().toString('hex'));

    return nonce.toString('hex') + encrypted.toString('hex');
}

function decrypt(data, key) {
    let nonce = Buffer.from(data.slice(0, 24), 'hex');
    
    let decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);

    let buf = Buffer.from(data.slice(24, data.length));
    let sFrom = buf.length - 32;
    let authTagUtf8 = Uint8Array.prototype.slice.call(buf, sFrom, buf.length);
    let authTag = Buffer.from(authTagUtf8.toString(), 'hex');

    decipher.setAuthTag(authTag);

    let encryptedTextUtf8 = Uint8Array.prototype.slice.call(buf, 0, sFrom);
    let encryptedText = Buffer.from(encryptedTextUtf8.toString(), 'hex');

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.toString();
}

module.exports = {
    encrypt,
    decrypt
}