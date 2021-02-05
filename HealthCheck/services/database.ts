import { InfluxDB, WriteApi } from "@influxdata/influxdb-client";
import * as Sentry from "@sentry/node";

class DatabaseService {
    private client: InfluxDB;
    private org: string;
    private bucket: string;
    private writeClient: WriteApi;

    constructor() {
        this.client = new InfluxDB({
            url: process.env.INFLUXDB_HOST,
            token: process.env.INFLUXDB_TOKEN,
        });
        this.org = process.env.INFLUXDB_ORG;
        this.bucket = process.env.INFLUXDB_BUCKET;
        this.writeClient = this.client.getWriteApi(this.org, this.bucket, "s", {
            writeFailed: (error: Error, lines: string[], attempts: number) => {
                console.log(error, lines, attempts);
                if (attempts >= 3) {
                    Sentry.captureException(error);
                    console.log(error);
                }
            },
        });
    }

    public writePoints(points) {
        return this.writeClient.writePoints(points);
    }

    public async flush() {
        return await this.writeClient.flush();
    }
}

export default new DatabaseService();
