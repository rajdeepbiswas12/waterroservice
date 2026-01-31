import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigService]
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadConfig', () => {
    it('should load configuration from assets', async () => {
      const mockConfig = {
        apiUrl: 'https://api.example.com',
        production: true
      };

      const loadPromise = service.loadConfig();

      const req = httpMock.expectOne('/assets/config.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockConfig);

      await loadPromise;

      expect(service.getApiUrl()).toBe('https://api.example.com');
      expect(service.isProduction()).toBe(true);
    });

    it('should use default config when loading fails', async () => {
      const loadPromise = service.loadConfig();

      const req = httpMock.expectOne('/assets/config.json');
      req.error(new ProgressEvent('error'));

      await loadPromise;

      expect(service.getApiUrl()).toBe('http://localhost:5000/api');
      expect(service.isProduction()).toBe(false);
    });

    it('should handle HTTP error gracefully', async () => {
      const loadPromise = service.loadConfig();

      const req = httpMock.expectOne('/assets/config.json');
      req.flush('Error', { status: 404, statusText: 'Not Found' });

      await loadPromise;

      expect(service.getApiUrl()).toBe('http://localhost:5000/api');
      expect(service.isProduction()).toBe(false);
    });
  });

  describe('getApiUrl', () => {
    it('should return default API URL before config is loaded', () => {
      expect(service.getApiUrl()).toBe('http://localhost:5000/api');
    });

    it('should return configured API URL after config is loaded', async () => {
      const mockConfig = {
        apiUrl: 'https://production.api.com',
        production: true
      };

      const loadPromise = service.loadConfig();
      const req = httpMock.expectOne('/assets/config.json');
      req.flush(mockConfig);
      await loadPromise;

      expect(service.getApiUrl()).toBe('https://production.api.com');
    });
  });

  describe('isProduction', () => {
    it('should return false before config is loaded', () => {
      expect(service.isProduction()).toBe(false);
    });

    it('should return production flag after config is loaded', async () => {
      const mockConfig = {
        apiUrl: 'https://production.api.com',
        production: true
      };

      const loadPromise = service.loadConfig();
      const req = httpMock.expectOne('/assets/config.json');
      req.flush(mockConfig);
      await loadPromise;

      expect(service.isProduction()).toBe(true);
    });

    it('should handle false production flag', async () => {
      const mockConfig = {
        apiUrl: 'http://localhost:5000/api',
        production: false
      };

      const loadPromise = service.loadConfig();
      const req = httpMock.expectOne('/assets/config.json');
      req.flush(mockConfig);
      await loadPromise;

      expect(service.isProduction()).toBe(false);
    });
  });

  it('should allow multiple calls to getApiUrl', async () => {
    const mockConfig = {
      apiUrl: 'https://api.example.com',
      production: true
    };

    const loadPromise = service.loadConfig();
    const req = httpMock.expectOne('/assets/config.json');
    req.flush(mockConfig);
    await loadPromise;

    expect(service.getApiUrl()).toBe('https://api.example.com');
    expect(service.getApiUrl()).toBe('https://api.example.com');
    expect(service.getApiUrl()).toBe('https://api.example.com');
  });

  it('should cache loaded config', async () => {
    const mockConfig = {
      apiUrl: 'https://cached.api.com',
      production: true
    };

    const loadPromise = service.loadConfig();
    const req = httpMock.expectOne('/assets/config.json');
    req.flush(mockConfig);
    await loadPromise;

    // Subsequent calls should not trigger HTTP requests
    expect(service.getApiUrl()).toBe('https://cached.api.com');
    expect(service.isProduction()).toBe(true);
    
    // Verify no additional HTTP requests were made
    httpMock.expectNone('/assets/config.json');
  });
});
