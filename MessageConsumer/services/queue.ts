import {
    DeleteMessageCommand,
    Message,
    ReceiveMessageCommand,
    SQSClient,
} from "@aws-sdk/client-sqs";

class Queue {
    private client: SQSClient;
    private queueUrl: string;
    constructor() {
        this.client = new SQSClient({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
            region: process.env.AWS_REGION,
            maxAttempts: 3,
        });
        this.queueUrl = process.env.AWS_SQS_URL;
    }

    public async getRecentMessages(): Promise<Message[]> {
        const response = await this.client.send(
            new ReceiveMessageCommand({
                AttributeNames: ["SentTimestamp"],
                MaxNumberOfMessages: 10,
                MessageAttributeNames: ["All"],
                QueueUrl: this.queueUrl,
                VisibilityTimeout: 20,
                WaitTimeSeconds: 0,
            })
        );
        return response.Messages || [];
    }

    public async deleteMessage(receiptHandle: string) {
        return await this.client.send(
            new DeleteMessageCommand({
                ReceiptHandle: receiptHandle,
                QueueUrl: this.queueUrl,
            })
        );
    }
}

export default new Queue();