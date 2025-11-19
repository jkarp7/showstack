import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits

// Get encryption key from environment or generate a warning
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY

  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }

  if (keyHex.length !== KEY_LENGTH * 2) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`)
  }

  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypt sensitive data (e.g., Plaid access tokens)
 * Returns: iv:authTag:encrypted (all hex-encoded)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate a random encryption key for initial setup
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}
