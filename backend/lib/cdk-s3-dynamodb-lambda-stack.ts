import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as aws_dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as aws_lambda from 'aws-cdk-lib/aws-lambda';
import * as aws_iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as aws_lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { AuthorizationType } from 'aws-cdk-lib/aws-apigateway';




// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkS3DynamodbLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bucket = new cdk.aws_s3.Bucket(this, 'FovusbelenBucket', {
      bucketName: 'fovusbelen',
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const table = new aws_dynamodb.Table(this, 'CdkS3DynamodbLambdaTable', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: aws_dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // const iamRole = new aws_iam.Role(this, 'InstanceRole', {
    //   assumedBy: new aws_iam.ServicePrincipal('ec2.amazonaws.com'),
    // });

    const lambdaExecutionRole = new aws_iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ],
    });



    // bucket.grantRead(iamRole);
    bucket.grantRead(lambdaExecutionRole);
    table.grantWriteData(lambdaExecutionRole);



   
    const fn = new cdk.aws_lambda.Function(this, 'CdkS3DynamodbLambdaFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
     handler: 'index.handler',
      code: aws_lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
     
    });

    table.grantWriteData(fn);

    const api = new cdk.aws_apigateway.RestApi(this, 'CdkS3DynamodbLambdaApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      }
    });

    const apiAuthorizer = new cdk.aws_apigateway.CfnAuthorizer(this, 'CdkS3DynamodbLambdaApiAuthorizer', {
      restApiId: api.restApiId,
      name: 'CogAuth',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: ['arn:aws:cognito-idp:us-east-1:211125772827:userpool/us-east-1_CkEUfH3KX'],
    });

    const integration = new cdk.aws_apigateway.LambdaIntegration(fn, {
      proxy: true,
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",  
            
          },
        },
      ],
    });

    const method = api.root.addMethod('GET', integration, {
      authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: apiAuthorizer.ref },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
          },
        },
      ],
    });
    

    // const lambdaApi = new cdk.aws_apigateway.LambdaRestApi(this, 'CdkS3Dynamodb', {
    //   handler: fn,
    //   proxy: false,
    // });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? 'Something went wrong with the deployment',
    });

   
    
    // Attach policies for accessing S3 and DynamoDB
    // iamRole.addManagedPolicy(aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
    // iamRole.addManagedPolicy(aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    

    const uploadFile = api.root.addResource('uploadFile');
    uploadFile.addMethod('POST', integration, {
      authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: apiAuthorizer.ref },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
          },
        },
      ],
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum install -y aws-cfn-bootstrap',
      '/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource InstanceAsg --region ${AWS::Region}'
    );

    const ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc: ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      role: lambdaExecutionRole, 
      userData: ec2.UserData.forLinux(), 
    });



    fn.addEventSource(new aws_lambda_event_sources.DynamoEventSource(table, {
      startingPosition: aws_lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 1,
      bisectBatchOnError: true,
      onFailure: new aws_lambda_event_sources.SqsDlq(new sqs.Queue(this, 'DLQ')),
      retryAttempts: 2,
    })

    )
  }
}
