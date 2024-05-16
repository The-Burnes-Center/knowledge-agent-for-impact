import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { UserPool, UserPoolIdentityProviderOidc,UserPoolClient, UserPoolClientIdentityProvider, ProviderAttribute } from 'aws-cdk-lib/aws-cognito';

export class AuthorizationStack extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    // Replace these values with your Azure client ID, client secret, and issuer URL
    // const azureClientId = 'your-azure-client-id';
    // const azureClientSecret = 'your-azure-client-secret';
    // const azureIssuerUrl = 'https://your-azure-issuer.com';

    // Create the Cognito User Pool
    const userPool = new UserPool(this, 'UserPool', {      
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // ... other user pool configurations
    });

    // Create a provider attribute for mapping Azure claims
    // const providerAttribute = new ProviderAttribute({
    //   name: 'custom_attr',
    //   type: 'String',
    // });
    userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: scope.toString(),
      },
    });
    

    // Add the Azure OIDC identity provider to the User Pool
    // const azureProvider = new UserPoolIdentityProviderOidc(this, 'AzureProvider', {
    //   clientId: azureClientId,
    //   clientSecret: azureClientSecret,
    //   issuerUrl: azureIssuerUrl,
    //   userPool: userPool,
    //   attributeMapping: {
    //     // email: ProviderAttribute.fromString('email'),
    //     // fullname: ProviderAttribute.fromString('name'),
    //     // custom: {
    //     //   customKey: providerAttribute,
    //     // },
    //   },
    //   // ... other optional properties
    // });

    
    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,      
      // supportedIdentityProviders: [UserPoolClientIdentityProvider.custom(azureProvider.providerName)],
    });
    
    // userPoolClient.node.addDependency(azureProvider);
    
  }
}
