import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: '/api',
};

export const API_CONFIG = "http://localhost:8080/api";
