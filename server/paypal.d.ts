declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export class PayPalHttpClient {
      constructor(environment: any);
    }
    export class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    export class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }
  
  export namespace orders {
    export class OrdersCreateRequest {
      constructor();
      requestBody(body: any): void;
    }
    export class OrdersCaptureRequest {
      constructor(orderId: string);
    }
  }
  
  export namespace subscriptions {
    export class SubscriptionsCreateRequest {
      constructor();
      requestBody(body: any): void;
    }
    export class SubscriptionsGetRequest {
      constructor(subscriptionId: string);
    }
    export class SubscriptionsCancelRequest {
      constructor(subscriptionId: string);
      requestBody(body: any): void;
    }
  }
}