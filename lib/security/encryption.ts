import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  return key
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512')
}

export function encrypt(text: string): string {
  const masterKey = getEncryptionKey()
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = deriveKey(masterKey, salt)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedData: string): string {
  const masterKey = getEncryptionKey()
  
  const parts = encryptedData.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }
  
  const salt = Buffer.from(parts[0], 'hex')
  const iv = Buffer.from(parts[1], 'hex')
  const tag = Buffer.from(parts[2], 'hex')
  const encrypted = parts[3]
  
  const key = deriveKey(masterKey, salt)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return salt + ':' + hash
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const parts = hashedPassword.split(':')
  if (parts.length !== 2) {
    return false
  }
  
  const salt = parts[0]
  const originalHash = parts[1]
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  
  return hash === originalHash
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) return email
  
  const visibleChars = Math.min(3, Math.floor(localPart.length / 2))
  const masked = localPart.substring(0, visibleChars) + '***'
  
  return masked + '@' + domain
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  
  return '***-***-' + digits.slice(-4)
}

export function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  
  return '**** **** **** ' + digits.slice(-4)
}

export function sanitizeForLog(obj: any): any {
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'apiKey',
    'secret',
    'ssn',
    'creditCard',
    'cvv',
    'pin',
  ]
  
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLog)
  }
  
  const sanitized: any = {}
  for (const key in obj) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveFields.some((field) => lowerKey.includes(field))
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeForLog(obj[key])
    } else {
      sanitized[key] = obj[key]
    }
  }
  
  return sanitized
}
