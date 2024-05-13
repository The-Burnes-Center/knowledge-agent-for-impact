import * as cdk from "aws-cdk-lib";

import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { aws_apigatewayv2 as apigwv2 } from "aws-cdk-lib";
// import {apigwv2} from 'aws-cdk-lib/aws_apigatewayv2'

import { Construct } from "constructs";

// import { Shared } from "../shared";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import {LambdaFunctionStack} from "../functions/functions"
import * as lambda from 'aws-cdk-lib/aws-lambda';
// import { NagSuppressions } from "cdk-nag";

interface WebsocketBackendAPIProps {  
  // readonly userPool: UserPool;
  // readonly api: appsync.GraphqlApi;
}

export class WebsocketBackendAPI extends Construct {
  public readonly wsAPI : apigwv2.WebSocketApi;
  public readonly wsFunction : lambda.Function;
  constructor(
    scope: Construct,
    id: string,
    props: WebsocketBackendAPIProps
  ) {
    super(scope, id);
    // Create the main Message Topic acting as a message bus
    const webSocketApi = new apigwv2.WebSocketApi(this, 'wsAPI');
    const webSocketApiStage =  new apigwv2.WebSocketStage(this, 'wsAPI-prod', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
      
    });
    // function addLambda() {
    const lambdaFunction = new LambdaFunctionStack(this, "ChatFunction", {wsApiEndpoint : webSocketApiStage.url})

    this.wsAPI = webSocketApi;
    this.wsFunction = lambdaFunction.chatFunction;
    // }
  }

}
