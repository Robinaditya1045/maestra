import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const bucket = process.env.MINIO_BUCKET || "videos";

const s3Client = new S3Client({
    endpoint,
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "maestra",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "maestra_secret",
    },
    forcePathStyle: true,
});

/**
 * Generate a presigned URL for uploading a video file
 */
export async function getUploadPresignedUrl(
    storageKey: string,
    contentType: string,
    expiresIn = 3600
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get object metadata (for Range request support)
 */
export async function getObjectMeta(storageKey: string) {
    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
    });
    const response = await s3Client.send(command);
    return {
        contentLength: response.ContentLength || 0,
        contentType: response.ContentType || "video/mp4",
    };
}

/**
 * Get an object stream from MinIO (supports Range)
 */
export async function getObjectStream(storageKey: string, range?: string) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Range: range,
    });
    return s3Client.send(command);
}

/**
 * Delete an object from MinIO
 */
export async function deleteObject(storageKey: string) {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKey,
    });
    return s3Client.send(command);
}

export { s3Client, bucket };
