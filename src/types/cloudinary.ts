export type CloudinaryNormalized = {
  url: string;            // всегда финальный URL для превью/сохранения
  publicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
  raw?: unknown;          // оригинал для отладки
};

// Источники:
export type CloudinaryWidgetResult = {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  [k: string]: any;
};

export type CloudinaryEdgeResult = {
  mainImageUrl?: string;
  publicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
  [k: string]: any;
};

export function isWidgetResult(x: any): x is CloudinaryWidgetResult {
  return !!x && (typeof x.secure_url === "string" || typeof x.public_id === "string");
}

export function isEdgeResult(x: any): x is CloudinaryEdgeResult {
  return !!x && (typeof x.mainImageUrl === "string" || typeof x.publicId === "string");
}

export function toNormalized(x: unknown): CloudinaryNormalized | null {
  if (isWidgetResult(x)) {
    const url = x.secure_url ?? "";
    if (!url) return null;
    return {
      url,
      publicId: x.public_id,
      width: x.width,
      height: x.height,
      bytes: x.bytes,
      raw: x
    };
  }
  if (isEdgeResult(x)) {
    const url = x.mainImageUrl ?? "";
    if (!url) return null;
    return {
      url,
      publicId: x.publicId,
      width: x.width,
      height: x.height,
      bytes: x.bytes,
      raw: x
    };
  }
  // Попытка универсального маппинга
  const anyx = x as any;
  const url = anyx?.url || anyx?.secure_url || anyx?.mainImageUrl;
  if (typeof url === "string" && url) {
    return {
      url,
      publicId: anyx?.publicId ?? anyx?.public_id,
      width: anyx?.width,
      height: anyx?.height,
      bytes: anyx?.bytes,
      raw: x
    };
  }
  return null;
}