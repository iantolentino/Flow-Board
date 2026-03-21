const encryptionService = require('../../../src/server/services/encryptionService');

describe('EncryptionService', () => {
  const testPassword = 'MySecretPassword123!';
  const testObject = { username: 'testuser', password: 'secret' };

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const encrypted = encryptionService.encrypt(testPassword);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(testPassword);
    });

    it('should produce different encrypted values for same input', () => {
      const encrypted1 = encryptionService.encrypt(testPassword);
      const encrypted2 = encryptionService.encrypt(testPassword);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('encryptObject/decryptObject', () => {
    it('should encrypt and decrypt objects correctly', () => {
      const encrypted = encryptionService.encryptObject(testObject);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(testObject);
    });
  });
});