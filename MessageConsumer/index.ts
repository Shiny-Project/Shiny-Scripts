const config = require("dotenv").config();
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import QueueService from "./services/queue";
import StorageService from "./services/storage";
import sleep from "./utils/sleep";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});

(async () => {
    while (true) {
        const transaction = Sentry.startTransaction({
            op: "polling",
            name: "Polling AWS SQS",
        });
        try {
            console.log(`Querying new messages...`);
            const messages = await QueueService.getRecentMessages();
            console.log(`Got ${messages?.length ?? 0} new messages.`);
            for (const message of messages) {
                console.log(`Starting processing ${message.MessageId}...`);
                const messageBody = JSON.parse(message.Body);
                console.log(`Start uploading ${messageBody.path}...`);
                await StorageService.uploadImage(messageBody.path);
                console.log(`Upload finished. Deleting message from queue...`);
                await QueueService.deleteMessage(message.ReceiptHandle);
                console.log(`Processing of ${message.MessageId} finished.`);
            }
        } catch (e) {
            Sentry.captureException(e);
        } finally {
            transaction.finish();
            await sleep(30000);
        }
    }
})();
