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

  interface ItemDetail {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  interface TransactionParams {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetail[];
  }

  interface TransactionStatusResponse {
    transaction_status: string;
    [key: string]: any;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(params: TransactionParams): Promise<{ token: string }>;
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
  };

  export default midtransClient;
}
