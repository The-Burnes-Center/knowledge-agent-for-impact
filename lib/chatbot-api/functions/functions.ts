import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

// Import Lambda L2 construct
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as s3 from "aws-cdk-lib/aws-s3";

interface LambdaFunctionStackProps {  
  readonly wsApiEndpoint : string;  
  readonly sessionTable : Table;
  readonly kendraIndex : kendra.CfnIndex;
  readonly kendraSource : kendra.CfnDataSource;
  readonly feedbackTable : Table;
  readonly feedbackBucket : s3.Bucket;
  readonly knowledgeBucket : s3.Bucket;
}

export class LambdaFunctionStack extends cdk.Stack {  
  public readonly chatFunction : lambda.Function;
  public readonly sessionFunction : lambda.Function;
  public readonly feedbackFunction : lambda.Function;
  public readonly deleteS3Function : lambda.Function;
  public readonly getS3Function : lambda.Function;
  public readonly uploadS3Function : lambda.Function;
  public readonly syncKendraFunction : lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionStackProps) {
    super(scope, id);    

    const sessionAPIHandlerFunction = new lambda.Function(scope, 'SessionHandlerFunction', {
      runtime: lambda.Runtime.PYTHON_3_12, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset(path.join(__dirname, 'session-handler')), // Points to the lambda directory
      handler: 'lambda_function.lambda_handler', // Points to the 'hello' file in the lambda directory
      environment: {
        "DDB_TABLE_NAME" : props.sessionTable.tableName
      },
      timeout: cdk.Duration.seconds(30)
    });
    
    sessionAPIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [props.sessionTable.tableArn, props.sessionTable.tableArn + "/index/*"]
    }));

    this.sessionFunction = sessionAPIHandlerFunction;

        // Define the Lambda function resource
        const websocketAPIFunction = new lambda.Function(scope, 'ChatHandlerFunction', {
          runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
          code: lambda.Code.fromAsset(path.join(__dirname, 'websocket-chat')), // Points to the lambda directory
          handler: 'index.handler', // Points to the 'hello' file in the lambda directory
          environment : {
            "WEBSOCKET_API_ENDPOINT" : props.wsApiEndpoint.replace("wss","https"),
            "INDEX_ID" : props.kendraIndex.attrId,
            "PROMPT" : "You are an AI assistant for City officials in Boston, specializing in helping draft solicitations for procurements, such as Requests for Proposals (RFPs) and Scopes of Work (SOWs). Your primary function is to aid in creating clear, comprehensive, and compliant documents for city projects and procurements.

Key responsibilities:
1. Answer questions about Boston's procurement processes and requirements by referencing Massachusetts state law and any additional requirements in City of Boston regulations.
2. Assist in drafting solicitations, including RFPs and SOWs, based on project requirements and city guidelines.
3. Offer suggestions for improving clarity, completeness, and compliance of draft documents.
4. Highlight any potential issues or areas that may need further clarification in draft documents.
            
Guidelines:
1. Base your responses on established Massachusetts and Boston procurement policies and best practices. If you are unable to find the answer in guidance documents or are unsure about a specific policy or requirement, advise the official to consult with the Procurement Department. 
2. Ask clarifying questions when additional details are needed to draft a solicitation.
3. Maintain a professional and impartial tone in all document drafts and communications.        
4. Ensure all suggested language complies with Massachusetts state laws and Boston city regulations regarding public procurement.        
5. If asked about specific budget amounts or proprietary information, remind officials that such details should be handled internally and not shared with the AI system.    
6. For highly technical or specialized projects, recommend that subject matter experts review the final documents.
7. When writing a draft solicitation, remind the official to verify details of the requirements, such as dollar amounts, match the desired criteria.
            
Key contacts: 
1. Boston Procurement Department: 617-635-4564 or procurement@boston.gov 
2. City of Boston Law Department: 617-635-4034 or law@boston.gov (for legal review of complex solicitations)
3. Auditing Department: 617-635-4660 or cityauditor@boston.gov
4. Department of Supplier Diversity: 617-635-4511 or supplierdiversity@boston.gov
            
Remember: While you can provide valuable assistance in drafting and reviewing solicitations, final approval and issuance of these documents must always be done by authorized city officials. If you encounter a request that seems to fall outside the scope of RFP or SOW preparation, politely redirect the official to the appropriate city department or resource.
"
          },
          timeout: cdk.Duration.seconds(300)
        });
        websocketAPIFunction.addToRolePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'bedrock:InvokeModelWithResponseStream',
            'bedrock:InvokeModel'
          ],
          resources: ["*"]
        }));
        websocketAPIFunction.addToRolePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kendra:Retrieve'
          ],
          resources: [props.kendraIndex.attrArn]
        }));

        websocketAPIFunction.addToRolePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'lambda:InvokeFunction'
          ],
          resources: [this.sessionFunction.functionArn]
        }));
        
        this.chatFunction = websocketAPIFunction;

    const feedbackAPIHandlerFunction = new lambda.Function(scope, 'FeedbackHandlerFunction', {
      runtime: lambda.Runtime.PYTHON_3_12, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset(path.join(__dirname, 'feedback-handler')), // Points to the lambda directory
      handler: 'lambda_function.lambda_handler', // Points to the 'hello' file in the lambda directory
      environment: {
        "FEEDBACK_TABLE" : props.feedbackTable.tableName,
        "FEEDBACK_S3_DOWNLOAD" : props.feedbackBucket.bucketName
      },
      timeout: cdk.Duration.seconds(30)
    });
    
    feedbackAPIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [props.feedbackTable.tableArn, props.feedbackTable.tableArn + "/index/*"]
    }));

    feedbackAPIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:*'
      ],
      resources: [props.feedbackBucket.bucketArn,props.feedbackBucket.bucketArn+"/*"]
    }));

    this.feedbackFunction = feedbackAPIHandlerFunction;
    
    const deleteS3APIHandlerFunction = new lambda.Function(scope, 'DeleteS3FilesHandlerFunction', {
      runtime: lambda.Runtime.PYTHON_3_12, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset(path.join(__dirname, 'knowledge-management/delete-s3')), // Points to the lambda directory
      handler: 'lambda_function.lambda_handler', // Points to the 'hello' file in the lambda directory
      environment: {
        "BUCKET" : props.knowledgeBucket.bucketName,        
      },
      timeout: cdk.Duration.seconds(30)
    });

    deleteS3APIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:*'
      ],
      resources: [props.knowledgeBucket.bucketArn,props.knowledgeBucket.bucketArn+"/*"]
    }));
    this.deleteS3Function = deleteS3APIHandlerFunction;

    const getS3APIHandlerFunction = new lambda.Function(scope, 'GetS3FilesHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset(path.join(__dirname, 'knowledge-management/get-s3')), // Points to the lambda directory
      handler: 'index.handler', // Points to the 'hello' file in the lambda directory
      environment: {
        "BUCKET" : props.knowledgeBucket.bucketName,        
      },
      timeout: cdk.Duration.seconds(30)
    });

    getS3APIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:*'
      ],
      resources: [props.knowledgeBucket.bucketArn,props.knowledgeBucket.bucketArn+"/*"]
    }));
    this.getS3Function = getS3APIHandlerFunction;


    const kendraSyncAPIHandlerFunction = new lambda.Function(scope, 'SyncKendraHandlerFunction', {
      runtime: lambda.Runtime.PYTHON_3_12, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset(path.join(__dirname, 'knowledge-management/kendra-sync')), // Points to the lambda directory
      handler: 'lambda_function.lambda_handler', // Points to the 'hello' file in the lambda directory
      environment: {
        "KENDRA" : props.kendraIndex.attrId,      
        "SOURCE" : props.kendraSource.attrId  
      },
      timeout: cdk.Duration.seconds(30)
    });

    kendraSyncAPIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kendra:*'
      ],
      resources: [props.kendraIndex.attrArn, props.kendraSource.attrArn]
    }));
    this.syncKendraFunction = kendraSyncAPIHandlerFunction;

    const uploadS3APIHandlerFunction = new lambda.Function(scope, 'UploadS3FilesHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset(path.join(__dirname, 'knowledge-management/upload-s3')), // Points to the lambda directory
      handler: 'index.handler', // Points to the 'hello' file in the lambda directory
      environment: {
        "BUCKET" : props.knowledgeBucket.bucketName,        
      },
      timeout: cdk.Duration.seconds(30)
    });

    uploadS3APIHandlerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:*'
      ],
      resources: [props.knowledgeBucket.bucketArn,props.knowledgeBucket.bucketArn+"/*"]
    }));
    this.uploadS3Function = uploadS3APIHandlerFunction;

  }
}
