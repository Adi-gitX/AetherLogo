// Minimal declaration for 'pg' so TypeScript won't error when we dynamically import it in server functions.
declare module "pg" {
  export class Client {
    constructor(opts?: unknown);
    connect(): Promise<void>;
    end(): Promise<void>;
    query(queryText: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
  }
}
