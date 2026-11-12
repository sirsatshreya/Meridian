import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const STORAGE_ROOT = path.resolve(process.cwd(), 'data', 'storage');

export interface StoredObjectResult {
  storageKey: string;
  absolutePath: string;
  fileSize: number;
  sha256Hash: string;
}

export class ObjectStorageService {
  constructor() {
    this.ensureDirectory(STORAGE_ROOT);
  }

  private ensureDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Computes the SHA-256 digest of a Buffer.
   * Note: This digest reflects byte-level equality against the recorded baseline
   * and does not independently establish cargo authenticity or document validity.
   */
  public computeSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Stores a binary payload in private persistent object storage.
   * Partitions by tradeId and preserves raw file on disk without embedding large Base64 in database.
   */
  public storeObject(
    tradeId: string,
    evidenceId: string,
    originalFileName: string,
    fileBuffer: Buffer
  ): StoredObjectResult {
    const tradeDir = path.join(STORAGE_ROOT, 'trades', tradeId);
    this.ensureDirectory(tradeDir);

    const ext = path.extname(originalFileName) || '.bin';
    const sanitizedFileName = `${evidenceId}${ext}`;
    const targetFilePath = path.join(tradeDir, sanitizedFileName);

    // Write raw binary file to persistent private storage
    fs.writeFileSync(targetFilePath, fileBuffer);

    const fileSize = fileBuffer.length;
    const sha256Hash = this.computeSha256(fileBuffer);
    const storageKey = `trades/${tradeId}/${sanitizedFileName}`;

    return {
      storageKey,
      absolutePath: targetFilePath,
      fileSize,
      sha256Hash,
    };
  }

  /**
   * Retrieves the raw buffer of a stored object.
   */
  public getObjectBuffer(storageKey: string): Buffer | null {
    const resolvedPath = path.join(STORAGE_ROOT, storageKey);
    // Path traversal check
    if (!resolvedPath.startsWith(STORAGE_ROOT)) {
      throw new Error('Access denied: Invalid storage key path traversal.');
    }
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    return fs.readFileSync(resolvedPath);
  }

  /**
   * Returns a readable stream for high-performance HTTP responses.
   */
  public getObjectStream(storageKey: string): fs.ReadStream | null {
    const resolvedPath = path.join(STORAGE_ROOT, storageKey);
    if (!resolvedPath.startsWith(STORAGE_ROOT)) {
      throw new Error('Access denied: Invalid storage key path traversal.');
    }
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    return fs.createReadStream(resolvedPath);
  }

  /**
   * Checks whether an object exists in storage.
   */
  public objectExists(storageKey: string): boolean {
    const resolvedPath = path.join(STORAGE_ROOT, storageKey);
    if (!resolvedPath.startsWith(STORAGE_ROOT)) {
      return false;
    }
    return fs.existsSync(resolvedPath);
  }

  /**
   * Recalculates the SHA-256 hash directly from the stored object binary on disk.
   */
  public recalculateHash(storageKey: string): string | null {
    const buffer = this.getObjectBuffer(storageKey);
    if (!buffer) return null;
    return this.computeSha256(buffer);
  }

  /**
   * Overwrite for testing tamper detection (simulation only).
   */
  public simulateTampering(storageKey: string, tamperedData: string): boolean {
    const resolvedPath = path.join(STORAGE_ROOT, storageKey);
    if (!fs.existsSync(resolvedPath)) return false;
    fs.writeFileSync(resolvedPath, Buffer.from(tamperedData, 'utf-8'));
    return true;
  }
}

export const objectStorage = new ObjectStorageService();
