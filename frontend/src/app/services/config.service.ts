import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = {
    apiUrl: environment.apiUrl,
    appName: environment.appName,
    version: environment.version,
    production: environment.production,
  };

  constructor() { }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get appName(): string {
    return this.config.appName;
  }

  get version(): string {
    return this.config.version;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  getFullApiUrl(endpoint: string): string {
    // Remove leading slash if present
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.apiUrl}/${formattedEndpoint}`;
  }
}
