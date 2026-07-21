import * as crypto from 'crypto';
import * as forge from 'node-forge';

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface AESCipher {
  key: Buffer;
  iv: Buffer;
}

export class CryptoUtil {
  static generateRSAKeyPair(bits: number = 2048): RSAKeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: bits,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return { publicKey, privateKey };
  }

  static generateAESKey(keyLength: number = 32): AESCipher {
    const key = crypto.randomBytes(keyLength);
    const iv = crypto.randomBytes(16);
    return { key, iv };
  }

  static encryptWithRSA(publicKeyPem: string, data: Buffer): Buffer {
    return crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      data,
    );
  }

  static decryptWithRSA(privateKeyPem: string, encryptedData: Buffer): Buffer {
    return crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedData,
    );
  }

  static encryptWithAES(key: Buffer, iv: Buffer, plaintext: Buffer): Buffer {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return encrypted;
  }

  static decryptWithAES(key: Buffer, iv: Buffer, ciphertext: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  }

  static generateSignature(privateKeyPem: string, data: Buffer): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKeyPem, 'base64');
  }

  static verifySignature(publicKeyPem: string, data: Buffer, signature: string): boolean {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKeyPem, signature, 'base64');
  }

  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static hmacSha256(key: string, data: string): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }
}
