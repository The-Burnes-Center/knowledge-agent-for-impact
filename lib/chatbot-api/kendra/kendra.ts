import * as cdk from 'aws-cdk-lib';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";

export interface KendraIndexStackProps {
  s3Bucket: s3.Bucket
}

export class KendraIndexStack extends cdk.Stack {
  public readonly kendraIndex : kendra.CfnIndex;
  constructor(scope: Construct, id: string, props: KendraIndexStackProps) {
    super(scope, id);

    const kendraIndexRole = new iam.Role(this, 'KendraIndexRole', {
      assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com'),
    });

    kendraIndexRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::${props.s3Bucket.bucketName}`,
          `arn:aws:s3:::${props.s3Bucket.bucketName}/*`,
        ],
      })
    );


    // Add the CloudWatch permissions
    kendraIndexRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'AWS/Kendra',
          },
        },
      })
    );

    // Add the CloudWatch Logs permissions
    kendraIndexRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:DescribeLogGroups'],
        resources: ['*'],
      })
    );

    kendraIndexRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup'],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/kendra/*`],
      })
    );

    kendraIndexRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:DescribeLogStreams', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/kendra/*:log-stream:*`],
      })
    );

    // Create a new Kendra index
    const index = new kendra.CfnIndex(this, 'KendraIndex', {
      name: 'gen-ai-chatbot-index',
      roleArn: 'arn:aws:iam::123456789012:role/KendraIndexRole',
      description: 'Gen AI Chatbot Kendra Index',
      edition: 'DEVELOPER_EDITION',
    });


    const kendraDataSourceRole = new iam.Role(this, 'KendraDataSourceRole', {
      assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com'),
    });

    kendraDataSourceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::${props.s3Bucket.bucketName}`,
          `arn:aws:s3:::${props.s3Bucket.bucketName}/*`,
        ],
      })
    );


    // Use the provided S3 bucket for the data source and FAQ
    const dataSource = new kendra.CfnDataSource(this, 'KendraS3DataSource', {
      indexId: index.attrId,
      name: 's3-source',
      type: 'S3',
      dataSourceConfiguration: {
        s3Configuration: {
          bucketName: props.s3Bucket.bucketName,
        },
      }
    });

    this.kendraIndex = index;
  }
}
