
// Переэкспорт унифицированных типов
export * from '@/types/order';

export interface InitializationState {
  isInitializing: boolean;
  error: string | null;
  stage: string;
  progress: number;
}

export interface SubmissionState {
  isLoading: boolean;
  stage: string;
  progress: number;
}
