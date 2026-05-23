/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal type declarations for the untyped `iyzipay` package.
// Only the subset we actually use.

export type IyzipayClient = {
  checkoutFormInitialize: {
    create(request: Record<string, unknown>, cb: (err: any, result: any) => void): void;
  };
  checkoutForm: {
    retrieve(request: Record<string, unknown>, cb: (err: any, result: any) => void): void;
  };
  refund: {
    create(request: Record<string, unknown>, cb: (err: any, result: any) => void): void;
  };
  apiTest?: {
    retrieve(request: Record<string, unknown>, cb: (err: any, result: any) => void): void;
  };
};

export type IyzipayCtor = new (opts: {
  apiKey: string;
  secretKey: string;
  uri: string;
}) => IyzipayClient;

/** Wrap an iyzipay resource method (create/retrieve) — `this` must be the resource, not the root client. */
export function promisify<T = any>(
  resource: object,
  fn: (req: Record<string, unknown>, cb: (err: any, result: any) => void) => void,
  request: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      fn.call(resource, request, (err: unknown, result: T) => {
        if (err) return reject(err);
        resolve(result);
      });
    } catch (err) {
      reject(err);
    }
  });
}
