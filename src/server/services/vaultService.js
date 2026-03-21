const VaultEntry = require('../models/VaultEntry');
const encryptionService = require('./encryptionService');

class VaultService {
  async getUserEntries(userId) {
    return await VaultEntry.findByUserId(userId);
  }
  
  async addEntry({ userId, site_name, username, password }) {
    const encrypted = encryptionService.encrypt(password);
    return await VaultEntry.create({
      userId,
      site_name,
      username,
      password_encrypted: encrypted
    });
  }
  
  async decryptEntry(entryId, userId) {
    const entry = await VaultEntry.findById(entryId, userId);
    if (!entry) return null;
    
    const decrypted = encryptionService.decrypt(entry.password_encrypted);
    return decrypted;
  }
  
  async deleteEntry(entryId, userId) {
    return await VaultEntry.delete(entryId, userId);
  }
}

module.exports = new VaultService();