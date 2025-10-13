/**
 * Извлекает Cloudinary timestamp из URL
 * Формат URL: https://res.cloudinary.com/.../v1760343212/...
 * @param url - Cloudinary URL
 * @returns timestamp или 0 если не найден
 */
export function extractCloudinaryTimestamp(url: string): number {
  const match = url.match(/\/v(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Сортирует массив Cloudinary URLs по timestamp (от старых к новым)
 * Это гарантирует, что первое загруженное фото будет первым в массиве
 * @param urls - Массив Cloudinary URLs
 * @returns Отсортированный массив URLs
 */
export function sortCloudinaryUrlsByTimestamp(urls: string[]): string[] {
  return [...urls].sort((a, b) => {
    const timestampA = extractCloudinaryTimestamp(a);
    const timestampB = extractCloudinaryTimestamp(b);
    return timestampA - timestampB; // Сортировка по возрастанию (старые → новые)
  });
}
