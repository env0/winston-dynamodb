import * as winston from 'winston';
import { TransportInstance } from 'winston';
export interface DynamoDBTransportOptions {
    useEnvironment?: boolean;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionKey?: string;
    region?: string;
    tableName: string;
    level: string;
    dynamoDoc?: boolean;
    partitionKey?: string;
}
export interface DynamoDBTransportInstance extends TransportInstance {
    new (options?: DynamoDBTransportOptions): DynamoDBTransportInstance;
}
export declare class DynamoDB extends winston.Transport implements DynamoDBTransportInstance {
    regions: string[];
    name: string;
    level: string;
    db: any;
    AWS: any;
    region: string;
    tableName: string;
    dynamoDoc: boolean;
    partitionKey: string;
    constructor(options?: DynamoDBTransportOptions);
    log(level: any, msg: any, meta: any, callback: any): any;
}
declare module "winston" {
    interface Transports {
        DynamoDB: DynamoDB;
    }
}
