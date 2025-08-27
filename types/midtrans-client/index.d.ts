declare module 'midtrans-client' {
  interface SnapConfig {
    isProduction?: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    email?: string;
  }

  interface TransactionParams {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(params: TransactionParams): Promise<{ token: string }>;
  }

  const midtransClient: {
    Snap: typeof Snap;
  };

  export default midtransClient;
}
