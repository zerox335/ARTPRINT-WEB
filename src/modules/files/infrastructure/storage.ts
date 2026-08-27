import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectStorage, StoreObjectInput, StoredObject } from "@/src/modules/files/domain/object-storage";
import { env } from "@/src/shared/env";

function safeLocalPath(root: string, key: string): string {
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, key);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) throw new Error("Storage path escaped its root");
  return target;
}

export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly root: string = env.LOCAL_STORAGE_PATH) {}

  async put(input: StoreObjectInput): Promise<StoredObject> {
    const target = safeLocalPath(this.root, input.key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.bytes, { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    });
    await writeFile(`${target}.content-type`, input.contentType, { flag: "w" });
    return { key: input.key };
  }

  async get(key: string) {
    const target = safeLocalPath(this.root, key);
    try {
      const [bytes, contentType] = await Promise.all([readFile(target), readFile(`${target}.content-type`, "utf8")]);
      return { bytes, contentType };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
}

export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) throw new Error("S3 storage is not configured");
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    });
  }

  async put(input: StoreObjectInput): Promise<StoredObject> {
    const response = await this.client.send(new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.key,
      Body: input.bytes,
      ContentType: input.contentType,
      Metadata: input.metadata,
      ServerSideEncryption: "AES256",
    }));
    return { key: input.key, etag: response.ETag };
  }

  async get(key: string) {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      if (!response.Body) return null;
      return { bytes: await response.Body.transformToByteArray(), contentType: response.ContentType ?? "application/octet-stream" };
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") return null;
      throw error;
    }
  }
}

export function objectStorage(): ObjectStorage {
  return env.STORAGE_DRIVER === "s3" ? new S3ObjectStorage() : new LocalObjectStorage();
}
