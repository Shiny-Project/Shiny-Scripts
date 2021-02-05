const config = require("dotenv").config();
const io = require("socket.io-client");
import * as Sentry from "@sentry/node";
import { Point } from "@influxdata/influxdb-client";
import sleep from "./utils/sleep";
import DatabaseService from "./services/database";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});

const connect = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const socket = io("http://websocket.shiny.kotori.moe:3737");
        const timer = setTimeout(() => {
            reject(new Error("timeout"));
        }, 10000);
        socket.on("connect", () => {
            clearTimeout(timer);
            resolve(socket);
        });
    });
};

(async () => {
    let counter = 0;
    while (true) {
        try {
            console.log("Start connecting to websocket server...");
            const startTime = Date.now();
            const socket = await connect();
            const connectedTime = Date.now();
            const rtt = connectedTime - startTime;
            console.log(`Websocket server connected within ${rtt}ms`);
            DatabaseService.writePoints([
                new Point("ttl")
                    .tag("location", process.env.REGION)
                    .intField("websocket", rtt),
            ]);
            socket.close();
            counter++;
            if (counter === 10) {
                counter = 0;
                console.log("Sending metrics to database...");
                await DatabaseService.flush();
            }
        } catch (e) {
            Sentry.captureException(e);
            console.log(e);
        }
        await sleep(30000);
    }
})();
