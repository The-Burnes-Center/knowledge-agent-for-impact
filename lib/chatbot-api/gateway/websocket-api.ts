import * as cdk from "aws-cdk-lib";

import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { aws_apigatewayv2 as apigwv2 } from "aws-cdk-lib";
// import {apigwv2} from 'aws-cdk-lib/aws_apigatewayv2'

import { Construct } from "constructs";

// import { Shared } from "../shared";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { NagSuppressions } from "cdk-nag";

interface WebsocketBackendAPIProps {  
  readonly userPool: UserPool;
  readonly api: appsync.GraphqlApi;
}

export class WebsocketBackendAPI extends Construct {

  constructor(
    scope: Construct,
    id: string,
    props: WebsocketBackendAPIProps
  ) {
    super(scope, id);
    // Create the main Message Topic acting as a message bus
    const webSocketApi = new apigwv2.WebSocketApi(this, 'mywsapi');
    new apigwv2.WebSocketStage(this, 'main-stage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });
    function addLambda() {
      
    }
  }

}
