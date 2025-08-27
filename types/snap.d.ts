interface MidtransSnap {
  pay(
    token: string,
    options?: {
      onSuccess?: (result: unknown) => void;
      onPending?: (result: unknown) => void;
      onError?: (error: unknown) => void;
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
