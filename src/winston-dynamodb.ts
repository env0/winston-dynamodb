import * as winston from 'winston';
import * as util from 'util';
import * as AWS from 'aws-sdk';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as os from 'os';

import { Transport } from 'winston';
import { TransportInstance } from 'winston';

const hostname = os.hostname();

export interface DynamoDBTransportOptions {
  useEnvironment?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  tableName: string;
  level: string;
  dynamoDoc?: boolean;
  partitionKey?: string
}

export interface DynamoDBTransportInstance extends TransportInstance {
  new (options?: DynamoDBTransportOptions): DynamoDBTransportInstance;
}

export class DynamoDB extends winston.Transport implements DynamoDBTransportInstance {
  regions: string[];
  name: string;
  level: string;
  db; // Type?
  AWS;  // Type?
  region: string;
  tableName: string;
  dynamoDoc: boolean;
  partitionKey: string;
  
  constructor(options?: DynamoDBTransportOptions) {
    super(options);

    if (options == null) {
      options = <DynamoDBTransportOptions>{};
    }
    this.regions = ["us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-northeast-1", "ap-northeast-2", "ap-southeast-1", "ap-southeast-2", "sa-east-1"];
    if (options.useEnvironment) {
      options.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      options.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      options.region = process.env.AWS_REGION;
    }
    if (options.accessKeyId == null) {
      throw new Error("need accessKeyId");
    }
    if (options.secretAccessKey == null) {
      throw new Error("need secretAccessKey");
    }
    if (options.region == null) {
      throw new Error("need region");
    }
    if (this.regions.indexOf(options.region) < 0) {
      throw new Error("unavailable region given");
    }
    if (options.tableName == null) {
      throw new Error("need tableName");
    }
    this.name = "dynamodb";
    this.level = options.level || "info";
    this.db = new AWS.DynamoDB({credentials: {accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey}, region: options.region});
    this.AWS = AWS;
    this.region = options.region;
    this.tableName = options.tableName;
    this.dynamoDoc = options.dynamoDoc;
    this.partitionKey = options.partitionKey;
  }

  // AREL TODO: Also fix README

  log(level, msg, meta, callback) {
    let params;
    let putCallback = (_this) => {
      return (err, data) => {
        if (err) {
          _this.emit("error", err);
          if (callback) {
            return callback(err, null);
          }
        } else {
          _this.emit("logged");
          if (callback) {
            return callback(null, "logged");
          }
        }
      };
    };
    putCallback(this);

    params = {
      TableName: this.tableName,
      Item: {
        id: {
          "S": this.partitionKey || uuid.v4()
        },
        level: {
          "S": level
        },
        timestamp: {
          "N": new Date().getTime().toString()
        },
        msg: {
          "S": msg
        },
        hostname: {
          "S": hostname
        }
      }
    };
    if (!_.isEmpty(meta)) {
      params.Item.meta = {
        "S": JSON.stringify(meta)
      };
    }
    return this.db.putItem(params, putCallback);
  }

}

import { Transports } from 'winston';
declare module "winston" {
  export interface Transports {
    DynamoDB: DynamoDB;
  }
}