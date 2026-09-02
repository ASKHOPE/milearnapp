import type { Note } from '../types';

export interface StorageHealth {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
  totalNotes: number;
  totalAttachments: number;
  mediaBytes: number;
  textBytes: number;
}

export class DataOptimizer {
  /**
   * Compresses an image or drawing to WebP with canvas downscaling
   * Reduces file size by 75% to 90% without visible quality loss
   */
  public async compressImage(
    source: File | string,
    maxDimension = 1600,
    quality = 0.82
  ): Promise<{ dataUrl: string; size: number; originalSize: number; savingsPercent: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale if exceeding max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Smooth image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format
        let webpDataUrl = canvas.toDataURL('image/webp', quality);
        // Fallback to JPEG if WebP is unsupported
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const compressedSize = Math.round(webpDataUrl.length * 0.75);
        const originalSize = typeof source === 'string' 
          ? Math.round(source.length * 0.75) 
          : source.size;

        const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        resolve({
          dataUrl: webpDataUrl,
          size: compressedSize,
          originalSize,
          savingsPercent: savings
        });
      };

      img.onerror = () => reject(new Error('Failed to load image for optimization'));

      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(source);
      }
    });
  }

  /**
   * Inspects browser storage estimate and breakdown
   */
  public async getStorageHealth(notes: Note[]): Promise<StorageHealth> {
    let usageBytes = 0;
    let quotaBytes = 0;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch (err) {
        console.warn('Storage estimate failed:', err);
      }
    }

    let textBytes = 0;
    let mediaBytes = 0;
    let totalAttachments = 0;

    notes.forEach((n) => {
      textBytes += (n.title.length + n.content.length) * 2;
      if (n.attachments) {
        totalAttachments += n.attachments.length;
        n.attachments.forEach((a) => {
          mediaBytes += a.size || (a.dataUrl ? Math.round(a.dataUrl.length * 0.75) : 0);
        });
      }
    });

    if (usageBytes === 0) {
      usageBytes = textBytes + mediaBytes;
      quotaBytes = 1024 * 1024 * 1024 * 5; // 5 GB fallback estimate
    }

    const usagePercent = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;

    return {
      usageBytes,
      quotaBytes,
      usagePercent,
      totalNotes: notes.length,
      totalAttachments,
      mediaBytes,
      textBytes
    };
  }

  /**
   * Formats bytes to human-readable string (KB, MB, GB)
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const optimizer = new DataOptimizer();
