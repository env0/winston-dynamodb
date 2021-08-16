(function() {
  var AWS, DynamoDB, _, hostname, util, uuid, winston,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  winston = require("winston");

  util = require("util");

  AWS = require("aws-sdk");

  uuid = require("node-uuid");

  _ = require("lodash");

  hostname = require("os").hostname();

  DynamoDB = exports.DynamoDB = function(options) {
    var ref, regions;
    if (options == null) {
      options = {};
    }
    regions = ["localhost", "us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-northeast-1", "ap-northeast-2", "ap-southeast-1", "ap-southeast-2", "sa-east-1"];
    if (options.useEnvironment) {
      options.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      options.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      options.sessionKey = process.env.AWS_SESSION_TOKEN;
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
    if (ref = options.region, indexOf.call(regions, ref) < 0) {
      throw new Error("unavailable region given");
    }
    if (options.tableName == null) {
      throw new Error("need tableName");
    }
    this.name = "dynamodb";
    this.level = options.level || "info";
    this.db = new AWS.DynamoDB({credentials: {accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey, sessionToken: options.sessionKey}, region: options.region});
    this.AWS = AWS;
    this.region = options.region;
    this.tableName = options.tableName;
    this.dynamoDoc = options.dynamoDoc;
    return this.partitionKey = options.partitionKey;
  };

  util.inherits(DynamoDB, winston.Transport);

  DynamoDB.prototype.log = function(level, msg, meta, callback) {
    var params, putCallback;
    putCallback = (function(_this) {
      return function(err, data) {
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
    })(this);

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

  winston.transports.DynamoDB = DynamoDB;

}).call(this);
