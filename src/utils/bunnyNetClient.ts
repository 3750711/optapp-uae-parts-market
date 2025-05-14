
// Клиент для работы с bunny.net API
interface BunnyNetConfig {
  apiKey: string;
  libraryId?: string;
}

class BunnyNetClient {
  private apiKey: string;
  private libraryId?: string;
  private baseUrl: string = "https://video.bunnycdn.com";

  constructor(config: BunnyNetConfig) {
    this.apiKey = config.apiKey;
    this.libraryId = config.libraryId;
  }

  // Получение заголовков для API запросов
  private getHeaders(): HeadersInit {
    return {
      "AccessKey": this.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }

  // Загрузка видео в Bunny.net
  async createVideo(title: string): Promise<any> {
    if (!this.libraryId) {
      throw new Error("Library ID is required for video upload");
    }

    const response = await fetch(`${this.baseUrl}/library/${this.libraryId}/videos`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`Failed to create video: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Получение URL для загрузки видео
  async getUploadUrl(videoId: string): Promise<string> {
    if (!this.libraryId) {
      throw new Error("Library ID is required for getting upload URL");
    }

    const response = await fetch(`${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`, {
      method: "GET",
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.uploadUrl;
  }

  // Загрузка файла видео напрямую в Bunny CDN
  async uploadVideoFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "application/octet-stream"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video file: ${response.status} ${response.statusText}`);
    }
  }

  // Получение информации о видео
  async getVideoInfo(videoId: string): Promise<any> {
    if (!this.libraryId) {
      throw new Error("Library ID is required for getting video info");
    }

    const response = await fetch(`${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`, {
      method: "GET",
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get video info: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Удаление видео
  async deleteVideo(videoId: string): Promise<void> {
    if (!this.libraryId) {
      throw new Error("Library ID is required for deleting video");
    }

    const response = await fetch(`${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`, {
      method: "DELETE",
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.status} ${response.statusText}`);
    }
  }

  // Получение публичного URL для воспроизведения
  getPlayerUrl(videoId: string, pullZone: string): string {
    return `https://${pullZone}.b-cdn.net/${videoId}/play_720p.mp4`;
  }
}

// Создаем экземпляр клиента с API ключом
const bunnyNet = new BunnyNetClient({
  apiKey: "21c22525-3b94-417e-9823-aaa92b97378aed901522-f450-4a84-b115-1a7147144a08",
  libraryId: process.env.BUNNY_LIBRARY_ID || ""
});

export default bunnyNet;
