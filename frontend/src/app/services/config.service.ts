import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface AppConfig {
  apiUrl: string;
  production: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    try {
      this.config = await firstValueFrom(
        this.http.get<AppConfig>('/assets/config.json')
      );
      console.log('Config loaded successfully:', this.config);
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
      // Provide defaults that work for production
      this.config = {
        apiUrl: 'http://localhost:5000/api',
        production: false
      };
    }
  }

  getApiUrl(): string {
    return this.config?.apiUrl || 'http://localhost:5000/api';
  }

  isProduction(): boolean {
    return this.config?.production || false;
  }
}
