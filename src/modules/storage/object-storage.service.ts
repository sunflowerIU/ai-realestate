import { Injectable, type OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ConfigService } from "@nestjs/config";

//headBucketCommand=check if bucket exists
//headObjectCommand=check if object exists
// PutObjectCommand: Upload an object.
// GetObjectCommand: Retrieve an object.
// HeadObjectCommand: Retrieve object information without its body.
// DeleteObjectCommand: Delete an object.

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("STORAGE_BUCKET");

    this.client = new S3Client({
      endpoint: this.config.getOrThrow<string>("STORAGE_ENDPOINT"),
      region: this.config.getOrThrow<string>("STORAGE_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("STORAGE_ACCESS_KEY"),
        secretAccessKey: this.config.getOrThrow<string>("STORAGE_SECRET_KEY"),
      },
      /*
       * Important for local MinIO.
       *
       * Uses:
       * localhost:9000/bucket/key
       *
       * instead of:
       * bucket.localhost:9000/key
       */
      forcePathStyle: true,
    });
  }

  //
  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
  }

  //
  private async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      ///to do:- currently every error will create new bucket like minio offline,invalid credentials etc. so fix it later
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  //
  async createPresignedUploadUrl(input: {
    objectKey: string;
    contentType: string;
    expiresInSeconds?: number;
  }) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ContentType: input.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? 300,
    });

    return {
      uploadUrl,
      objectKey: input.objectKey,
      expiresInSeconds: input.expiresInSeconds ?? 300,
    };
  }

  //
  async exists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );

      return true;
    } catch (error) {
      ///to do:- currently every error will return false like minio offline,invalid credentials etc. so fix it later
      return false;
    }
  }

  //
  async getMetadata(objectKey: string) {
    return this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  //
  async getObject(objectKey: string) {
    return this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  //
  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }
}
