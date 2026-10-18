import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { decryptCredentials, encryptCredentials, maskKey } from './crypto';

export interface SupabaseCredentials {
  project_url: string;
  project_id: string;
  anon_key: string;
  service_role_key: string;
  schema?: string;
  is_enabled: boolean;
}

export interface CloudinaryCredentials {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  upload_preset?: string;
  folder_name?: string;
  is_enabled: boolean;
}

export interface CloudServiceTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  details?: Record<string, any>;
}

class RuntimeCloudServices {
  private supabaseClient: SupabaseClient | null = null;
  private supabaseConfig: SupabaseCredentials | null = null;
  private cloudinaryConfig: CloudinaryCredentials | null = null;
  private isInitialized = false;

  constructor() {
    // Initialized when db is ready
  }

  /**
   * Initializes cloud services from stored system_settings records in db or default credentials
   */
  public init(dbProvider: { getSystemSettings: () => any[]; getSystemSetting: (name: string) => any }) {
    if (this.isInitialized) return;

    try {
      // 1. Supabase init (Uses admin settings if saved and decryptable; otherwise uses env/default credentials)
      let sbApplied = false;
      const spRecord = dbProvider.getSystemSetting('supabase');
      if (spRecord && spRecord.encrypted_credentials) {
        const decrypted = decryptCredentials<SupabaseCredentials>(spRecord.encrypted_credentials);
        if (decrypted && decrypted.project_url) {
          this.applySupabaseConfig(decrypted);
          sbApplied = true;
        }
      }
      if (!sbApplied) {
        const defaultSb: SupabaseCredentials = {
          project_url: process.env.SUPABASE_URL || 'https://oyjivjgyrtnyqwacjvgx.supabase.co',
          project_id: process.env.SUPABASE_PROJECT_ID || 'oyjivjgyrtnyqwacjvgx',
          anon_key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aml2amd5cnRueXF3YWNqdmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTkwNzksImV4cCI6MjEwNjgzNTA3OX0.h884sz7_OW8pa6Xg3AmIU1ZXlBhaM9aHUHYJc1B4aFs',
          service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aml2amd5cnRueXF3YWNqdmd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI1OTA3OSwiZXhwIjoyMTA2ODM1MDc5fQ.caw6VAGHy0LFr3yb-8i4UzkGpODnCCGYnnFk1uCCMUw',
          schema: 'public',
          is_enabled: true
        };
        this.applySupabaseConfig(defaultSb);
      }

      // 2. Cloudinary init (Uses admin settings if saved and decryptable; otherwise uses env/default credentials)
      let cldApplied = false;
      const cldRecord = dbProvider.getSystemSetting('cloudinary');
      if (cldRecord && cldRecord.encrypted_credentials) {
        const decrypted = decryptCredentials<CloudinaryCredentials>(cldRecord.encrypted_credentials);
        if (decrypted && decrypted.cloud_name) {
          this.applyCloudinaryConfig(decrypted);
          cldApplied = true;
        }
      }
      if (!cldApplied) {
        const defaultCld: CloudinaryCredentials = {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'cek17wle',
          api_key: process.env.CLOUDINARY_API_KEY || '219759888474739',
          api_secret: process.env.CLOUDINARY_API_SECRET || 'cPLW7OSGkRIndcZO5Pq0pH7l4Gw',
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
          folder_name: process.env.CLOUDINARY_FOLDER || 'chronicle_news',
          is_enabled: true
        };
        this.applyCloudinaryConfig(defaultCld);
      }

      this.isInitialized = true;
      console.log('✅ Runtime Cloud Services initialized dynamically with active Supabase & Cloudinary.');
    } catch (err: any) {
      console.error('Error initializing runtime cloud services:', err.message);
    }
  }

  // ----------------------------------------------------
  // SUPABASE DYNAMIC RUNTIME MANAGEMENT
  // ----------------------------------------------------

  public normalizeSupabaseUrl(url?: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    // If user pasted dashboard link: https://supabase.com/dashboard/project/swtjumssgwdmxscwgmtf
    const dashMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
    if (dashMatch && dashMatch[1]) {
      return `https://${dashMatch[1]}.supabase.co`;
    }
    return trimmed;
  }

  public extractProjectId(url?: string): string {
    if (!url) return '';
    const dashMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
    if (dashMatch && dashMatch[1]) return dashMatch[1];
    try {
      const parsed = new URL(url);
      const hostParts = parsed.hostname.split('.');
      return hostParts[0] || '';
    } catch {
      return '';
    }
  }

  public applySupabaseConfig(config: SupabaseCredentials) {
    const normalizedUrl = this.normalizeSupabaseUrl(config.project_url);
    const projectId = config.project_id || this.extractProjectId(config.project_url);

    this.supabaseConfig = {
      ...config,
      project_url: normalizedUrl,
      project_id: projectId
    };

    const url = normalizedUrl;
    // Prioritize Service Role Key for server operations, otherwise Anon Key
    const key = (config.service_role_key?.trim() || config.anon_key?.trim());

    if (config.is_enabled && url && key && !url.includes('your-project')) {
      try {
        this.supabaseClient = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          db: { schema: (config.schema?.trim() || 'public') as any }
        });
        console.log(`⚡ Supabase runtime client switched dynamically to: ${url}`);
      } catch (err: any) {
        console.error('Failed to instantiate dynamic Supabase client:', err.message);
        this.supabaseClient = null;
      }
    } else {
      this.supabaseClient = null;
    }
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabaseClient;
  }

  public getSupabaseConfig(): SupabaseCredentials | null {
    return this.supabaseConfig;
  }

  public isSupabaseActive(): boolean {
    return Boolean(this.supabaseClient && this.supabaseConfig?.is_enabled);
  }

  public async testSupabaseConnection(overrideConfig?: Partial<SupabaseCredentials>): Promise<CloudServiceTestResult> {
    const config = {
      ...(this.supabaseConfig || {}),
      ...(overrideConfig || {})
    } as SupabaseCredentials;

    const url = this.normalizeSupabaseUrl(config.project_url);
    const key = (config.service_role_key?.trim() || config.anon_key?.trim());
    const schema = config.schema?.trim() || 'public';

    if (!url || !key) {
      return {
        success: false,
        message: 'Supabase Project URL and Key (Anon or Service Role) are required to test connection.'
      };
    }

    const startTime = Date.now();
    try {
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: schema as any }
      });

      // Introspect or query
      const { data, error } = await client.from('posts').select('id').limit(1);
      const latencyMs = Date.now() - startTime;

      if (error) {
        const isTableMissing = 
          error.message.includes('schema cache') || 
          error.message.includes('Could not find the table') || 
          error.message.includes('relation') || 
          error.message.includes('does not exist') ||
          error.code === 'PGRST204' ||
          error.code === 'PGRST205' ||
          error.code === '42P01';

        if (isTableMissing) {
          return {
            success: true,
            message: `Successfully connected to Supabase (${url}) in ${latencyMs}ms. Connected to schema '${schema}' (run supabase_schema.sql to provision news tables).`,
            latencyMs,
            details: {
              project_url: url,
              schema,
              tables_pending: true,
              has_service_role: Boolean(config.service_role_key?.trim())
            }
          };
        }

        // If it's an authentication or network error, throw it
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `Successfully connected to Supabase (${url}) in ${latencyMs}ms. Database schema '${schema}' & tables verified.`,
        latencyMs,
        details: {
          project_url: url,
          schema,
          has_service_role: Boolean(config.service_role_key?.trim())
        }
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      let cleanMsg = err.message || 'Unknown network or authorization error';
      if (cleanMsg.includes('<!doctype') || cleanMsg.includes('<html') || cleanMsg.includes('404')) {
        cleanMsg = `Supabase endpoint returned 404. Verify your Project API URL (format: https://<project-ref>.supabase.co)`;
      }
      return {
        success: false,
        message: `Connection check failed: ${cleanMsg}`,
        latencyMs
      };
    }
  }

  // ----------------------------------------------------
  // CLOUDINARY DYNAMIC RUNTIME MANAGEMENT
  // ----------------------------------------------------

  public applyCloudinaryConfig(config: CloudinaryCredentials) {
    this.cloudinaryConfig = config;

    if (config.is_enabled && config.cloud_name?.trim() && config.api_key?.trim() && config.api_secret?.trim()) {
      cloudinary.config({
        cloud_name: config.cloud_name.trim(),
        api_key: config.api_key.trim(),
        api_secret: config.api_secret.trim(),
        secure: true
      });
      console.log(`☁️ Cloudinary runtime configuration switched dynamically to cloud: ${config.cloud_name}`);
    }
  }

  public getCloudinaryConfig(): CloudinaryCredentials | null {
    return this.cloudinaryConfig;
  }

  public isCloudinaryActive(): boolean {
    return Boolean(
      this.cloudinaryConfig &&
      this.cloudinaryConfig.is_enabled &&
      this.cloudinaryConfig.cloud_name &&
      this.cloudinaryConfig.api_key &&
      this.cloudinaryConfig.api_secret
    );
  }

  public async testCloudinaryConnection(overrideConfig?: Partial<CloudinaryCredentials>): Promise<CloudServiceTestResult> {
    const config = {
      ...(this.cloudinaryConfig || {}),
      ...(overrideConfig || {})
    } as CloudinaryCredentials;

    const cloud_name = config.cloud_name?.trim();
    const api_key = config.api_key?.trim();
    const api_secret = config.api_secret?.trim();

    if (!cloud_name || !api_key || !api_secret) {
      return {
        success: false,
        message: 'Cloud Name, API Key, and API Secret are required to test Cloudinary.'
      };
    }

    const startTime = Date.now();
    try {
      // Temporary test instance
      const testCloudinary = cloudinary;
      testCloudinary.config({
        cloud_name,
        api_key,
        api_secret,
        secure: true
      });

      // Execute ping via Cloudinary Admin API
      const pingResult = await testCloudinary.api.ping();
      const latencyMs = Date.now() - startTime;

      if (pingResult && pingResult.status === 'ok') {
        return {
          success: true,
          message: `Cloudinary credentials verified for cloud "${cloud_name}". Ping latency: ${latencyMs}ms.`,
          latencyMs,
          details: {
            cloud_name,
            folder: config.folder_name || 'chronicle_news',
            status: pingResult.status
          }
        };
      }

      return {
        success: true,
        message: `Cloudinary response received in ${latencyMs}ms.`,
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        message: `Cloudinary authorization failed: ${err.message || 'Invalid credentials or API error'}`,
        latencyMs
      };
    }
  }

  /**
   * Uploads base64 or URL asset directly to Cloudinary
   */
  public async uploadToCloudinary(
    fileSource: string,
    options?: { folder?: string; title?: string; resourceType?: 'image' | 'video' | 'auto' }
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    resource_type: string;
  }> {
    if (!this.isCloudinaryActive()) {
      throw new Error('Cloudinary is not configured or active');
    }

    const folder = options?.folder || this.cloudinaryConfig?.folder_name || 'chronicle_news';
    const resourceType = options?.resourceType || 'auto';

    const result = await cloudinary.uploader.upload(fileSource, {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resource_type: result.resource_type
    };
  }

  // ----------------------------------------------------
  // CLIENT SAFE DTO GENERATION (Masks all secrets!)
  // ----------------------------------------------------

  public getClientSafeSupabaseView(storedRecord?: any) {
    let config: SupabaseCredentials | null = null;
    if (storedRecord?.encrypted_credentials) {
      config = decryptCredentials<SupabaseCredentials>(storedRecord.encrypted_credentials);
    }
    if (!config || !config.project_url) {
      config = this.supabaseConfig;
    }

    return {
      service_name: 'supabase',
      project_url: config?.project_url || '',
      project_id: config?.project_id || (config?.project_url ? this.extractProjectId(config.project_url) : ''),
      anon_key: config?.anon_key || '',
      service_role_key_masked: maskKey(config?.service_role_key),
      has_service_role_key: Boolean(config?.service_role_key?.trim()),
      schema: config?.schema || 'public',
      is_enabled: config ? config.is_enabled : false,
      status: storedRecord?.status || (this.isSupabaseActive() ? 'connected' : 'not_configured'),
      status_message: storedRecord?.status_message || (this.isSupabaseActive() ? 'Runtime client initialized' : 'Awaiting configuration'),
      last_tested_at: storedRecord?.last_tested_at || null,
      updated_at: storedRecord?.updated_at || null,
      updated_by: storedRecord?.updated_by || 'system'
    };
  }

  public getClientSafeCloudinaryView(storedRecord?: any) {
    let config: CloudinaryCredentials | null = null;
    if (storedRecord?.encrypted_credentials) {
      config = decryptCredentials<CloudinaryCredentials>(storedRecord.encrypted_credentials);
    }
    if (!config || !config.cloud_name) {
      config = this.cloudinaryConfig;
    }

    return {
      service_name: 'cloudinary',
      cloud_name: config?.cloud_name || '',
      api_key: config?.api_key || '',
      api_secret_masked: maskKey(config?.api_secret),
      has_api_secret: Boolean(config?.api_secret?.trim()),
      upload_preset: config?.upload_preset || '',
      folder_name: config?.folder_name || 'chronicle_news',
      is_enabled: config ? config.is_enabled : false,
      status: storedRecord?.status || (this.isCloudinaryActive() ? 'connected' : 'not_configured'),
      status_message: storedRecord?.status_message || (this.isCloudinaryActive() ? 'Ready for media uploads' : 'Awaiting configuration'),
      last_tested_at: storedRecord?.last_tested_at || null,
      updated_at: storedRecord?.updated_at || null,
      updated_by: storedRecord?.updated_by || 'system'
    };
  }
}

export const cloudServices = new RuntimeCloudServices();
