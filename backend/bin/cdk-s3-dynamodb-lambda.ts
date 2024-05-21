#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkS3DynamodbLambdaStack } from "../lib/cdk-s3-dynamodb-lambda-stack";

const app = new cdk.App();
new CdkS3DynamodbLambdaStack(app, "CdkS3DynamodbLambdaStack", {
  env: {
    account: `211125772827`,
    region: `us-east-1`,
  },
});
