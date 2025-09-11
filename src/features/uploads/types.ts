export type UploadStatus =
  | 'idle'
  | 'compressing'
  | 'uploading'
  | 'completed'
  | 'error';

export interface UploadItem {
  id: string;                    // stable key
  file?: File | null;            // нет у уже существующих фото
  previewUrl: string;            // blob:... для новых или готовый url для существующих
  progress: number;              // 0..100
  status: UploadStatus;
  url?: string;                  // итоговый CDN url
  error?: string | null;
}

export type UploadChange = {
  items: UploadItem[];
  completedUrls: string[];
  hasActive: boolean;            // есть ли ещё compressing/uploading
};