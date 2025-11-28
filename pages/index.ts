// Page Object Model exports
export { BasePage } from './BasePage';
export { LoginPage } from './LoginPage';
export { MFAPage } from './MFAPage';
export { HomePage } from './HomePage';
export { AuthenticationManager } from './AuthenticationManager';

// Type definitions for page objects
export interface AuthenticationResult {
  isAuthenticated: boolean;
  currentUrl: string;
  pageTitle: string;
}

export interface MFADetectionResult {
  type: 'direct-totp' | 'another-way' | 'direct-code-option' | 'text-indicator';
  element?: any;
  text?: string;
}

export interface PageObjectConfig {
  browserName: string;
  timeout: number;
  retryCount: number;
}