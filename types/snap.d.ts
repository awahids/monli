export interface SnapResult {
  order_id: string;
  [key: string]: unknown;
}

export interface MidtransSnap {
  pay(
    token: string,
    options?: {
      onSuccess?: (result: SnapResult) => void;
      onPending?: (result: SnapResult) => void;
      onError?: (error: SnapResult) => void;
      onClose?: () => void;
    },
  ): void;
}

declare global {
  interface Window {
    snap?: MidtransSnap;
  }
}

export {};
