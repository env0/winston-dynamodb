"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDB = void 0;
var winston = require("winston");
var AWS = require("aws-sdk");
var uuid = require("node-uuid");
var _ = require("lodash");
var os = require("os");
var hostname = os.hostname();
var DynamoDB = /** @class */ (function (_super) {
    __extends(DynamoDB, _super);
    function DynamoDB(options) {
        var _this_1 = _super.call(this, options) || this;
        if (options == null) {
            options = {};
        }
        _this_1.regions = ["us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-northeast-1", "ap-northeast-2", "ap-southeast-1", "ap-southeast-2", "sa-east-1"];
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
        if (_this_1.regions.indexOf(options.region) < 0) {
            throw new Error("unavailable region given");
        }
        if (options.tableName == null) {
            throw new Error("need tableName");
        }
        _this_1.name = "dynamodb";
        _this_1.level = options.level || "info";
        _this_1.db = new AWS.DynamoDB({ credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }, region: options.region });
        _this_1.AWS = AWS;
        _this_1.region = options.region;
        _this_1.tableName = options.tableName;
        _this_1.dynamoDoc = options.dynamoDoc;
        _this_1.partitionKey = options.partitionKey;
        return _this_1;
    }
    // AREL TODO: Also fix README
    DynamoDB.prototype.log = function (level, msg, meta, callback) {
        var params;
        var putCallback = function (_this) {
            return function (err, data) {
                if (err) {
                    _this.emit("error", err);
                    if (callback) {
                        return callback(err, null);
                    }
                }
                else {
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
    };
    return DynamoDB;
}(winston.Transport));
exports.DynamoDB = DynamoDB;
