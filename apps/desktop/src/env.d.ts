/**
 * Augment ImportMeta with Vite environment variables.
 *
 * The renderer process uses Vite, which provides import.meta.env.
 * When the root tsconfig resolves renderer files through module
 * resolution, this declaration prevents TypeScript errors.
 */
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
