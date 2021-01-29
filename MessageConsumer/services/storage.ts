import * as path from "path";
import * as fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

class Storage {
    private client: S3Client;
    private bucketName: string;
    constructor() {
        this.client = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
            region: process.env.AWS_REGION,
            maxAttempts: 3,
        });
        this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    }

    public async uploadImage(filePath: string) {
        const fileName = path.basename(filePath);
        const stream = fs.createReadStream(filePath);
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Body: stream,
                    Key: fileName,
                })
            );
        } finally {
            stream.close();
        }
    }
}

export default new Storage();
