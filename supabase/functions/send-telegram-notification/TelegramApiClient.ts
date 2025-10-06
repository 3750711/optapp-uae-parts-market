import { ImageOptimizer } from './ImageOptimizer.ts';

interface SendMessageOptions {
  chatId: string;
  text: string;
  parseMode?: string;
  disableWebPagePreview?: boolean;
}

interface MediaItem {
  type: string;
  media: string;
  caption?: string;
  parse_mode?: string;
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number, message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class TelegramApiClient {
  private baseUrl: string;

  constructor(private botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  private parseRetryAfter(description: string): number | null {
    const match = description.match(/retry after (\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  async sendMessage(options: SendMessageOptions): Promise<any> {
    const url = `${this.baseUrl}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: options.chatId,
        text: options.text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disableWebPagePreview ?? true
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      const retryAfter = this.parseRetryAfter(data.description || '');
      if (retryAfter !== null) {
        throw new RateLimitError(retryAfter, `Telegram rate limit: retry after ${retryAfter}s`);
      }
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return data.result;
  }

  async sendMediaGroup(chatId: string, images: string[], caption?: string): Promise<any> {
    const optimizedImages = ImageOptimizer.prepareImagesForTelegram(images);
    
    const media: MediaItem[] = optimizedImages.map((url, index) => ({
      type: 'photo',
      media: url,
      ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {})
    }));

    const url = `${this.baseUrl}/sendMediaGroup`;
    
    let lastError: Error | null = null;
    
    // Retry logic for WEBPAGE_MEDIA_EMPTY
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            media
          })
        });

        const data = await response.json();
        
        if (!data.ok) {
          const retryAfter = this.parseRetryAfter(data.description || '');
          if (retryAfter !== null) {
            throw new RateLimitError(retryAfter, `Telegram rate limit: retry after ${retryAfter}s`);
          }
          
          if (data.description?.includes('WEBPAGE_MEDIA_EMPTY') && attempt < 3) {
            console.log(`⚠️ WEBPAGE_MEDIA_EMPTY error, attempt ${attempt}/3, retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            lastError = new Error(data.description);
            continue;
          }
          throw new Error(`Telegram API error: ${data.description}`);
        }

        return data.result;
      } catch (error) {
        lastError = error as Error;
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error('Failed to send media group after 3 attempts');
  }

  async sendMultipleMediaGroups(chatId: string, images: string[], caption?: string): Promise<any[]> {
    const optimizedImages = ImageOptimizer.prepareImagesForTelegram(images);
    const results: any[] = [];
    
    // Split into batches of 10
    for (let i = 0; i < optimizedImages.length; i += 10) {
      const batch = optimizedImages.slice(i, i + 10);
      const batchCaption = i === 0 ? caption : undefined;
      
      try {
        const result = await this.sendMediaGroup(chatId, batch, batchCaption);
        results.push(result);
        
        // Small delay between batches
        if (i + 10 < optimizedImages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed to send batch ${i / 10 + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}
