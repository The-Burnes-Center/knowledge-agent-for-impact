import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ChatBotApi } from "./chatbot-api";
import { AUTHENTICATION } from "./constants"
import { AuthorizationStack } from "./authorization"
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class GenAiMvpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'GenAiMvpQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    let authentication;
    if (AUTHENTICATION) {
      authentication = new AuthorizationStack(this, "Authorization")
    }

    const chatbotAPI = new ChatBotApi(this, "ChatbotAPI", {authentication});
    
  }
}
