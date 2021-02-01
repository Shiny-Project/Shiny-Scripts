const config = require("dotenv").config();
import * as Sentry from "@sentry/node";
import QueueService from "./services/queue";
import StorageService from "./services/storage";
import sleep from "./utils/sleep";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});

(async () => {
    while (true) {
        try {
            console.log(`Querying new messages...`);
            const messages = await QueueService.getRecentMessages();
            console.log(`Got ${messages?.length ?? 0} new messages.`);
            for (const message of messages) {
                console.log(`Starting processing ${message.MessageId}...`);
                const messageBody = JSON.parse(message.Body);
                if (messageBody.paths && messageBody.paths.length > 0) {
                    for (const path of messageBody.paths) {
                        console.log(`Start uploading ${path}...`);
                        await StorageService.uploadImage(path);
                        console.log(
                            `Upload finished. Deleting message from queue...`
                        );
                    }
                }
                await QueueService.deleteMessage(message.ReceiptHandle);
                console.log(`Processing of ${message.MessageId} finished.`);
            }
        } catch (e) {
            Sentry.captureException(e);
        } finally {
            await sleep(30000);
        }
    }
})();
