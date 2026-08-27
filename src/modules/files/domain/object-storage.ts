export type StoredObject = {
  key: string;
  etag?: string;
};

export type StoreObjectInput = {
  key: string;
  bytes: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
};

export interface ObjectStorage {
  put(input: StoreObjectInput): Promise<StoredObject>;
  get(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
}
