import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import Lambda L2 construct
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface LambdaFunctionStackProps {  
  readonly wsApiEndpoint : string;  
}

export class LambdaFunctionStack extends cdk.Stack {  
  public readonly chatFunction : lambda.Function;
  constructor(scope: Construct, id: string, props: LambdaFunctionStackProps) {
    super(scope, id);

    // Define the Lambda function resource
    const websocketAPIFunction = new lambda.Function(this, 'ChatHandler', {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset('./websocket-chat'), // Points to the lambda directory
      handler: 'index.handler', // Points to the 'hello' file in the lambda directory
      environment : {
        "mvp_websocket__api_endpoint_test" : props.wsApiEndpoint
      }
    });

    this.chatFunction = websocketAPIFunction;

    // const sessionAPIHandlerFunction = new lambda.Function(this, 'HelloWorldFunction', {
    //   runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
    //   code: lambda.Code.fromAsset('./websocket-chat'), // Points to the lambda directory
    //   handler: 'index.handler', // Points to the 'hello' file in the lambda directory
    // });

    // const viewS3FilesFunction = new lambda.Function(this, 'HelloWorldFunction', {
    //   runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
    //   code: lambda.Code.fromAsset('./websocket-chat'), // Points to the lambda directory
    //   handler: 'index.handler', // Points to the 'hello' file in the lambda directory
    // });
  }
}
