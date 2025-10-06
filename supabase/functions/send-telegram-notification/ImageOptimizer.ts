export class ImageOptimizer {
  static optimizeForTelegram(url: string): string {
    if (!url.includes('cloudinary.com')) {
      return url;
    }

    const transformations = 'f_jpg,q_auto:good,w_1280,c_limit';
    
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transformations}/`);
    }
    
    return url;
  }

  static sortImagesByVersion(images: string[]): string[] {
    return [...images].sort((a, b) => {
      const versionA = this.extractVersion(a);
      const versionB = this.extractVersion(b);
      return versionB - versionA;
    });
  }

  private static extractVersion(url: string): number {
    const match = url.match(/\/v(\d+)\//);
    return match ? parseInt(match[1]) : 0;
  }

  static prepareImagesForTelegram(images: string[]): string[] {
    const sorted = this.sortImagesByVersion(images);
    return sorted.map(url => this.optimizeForTelegram(url));
  }
}
