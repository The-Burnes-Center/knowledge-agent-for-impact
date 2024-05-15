import json
from jose import jwt, jwk
from jose.utils import base64url_decode
import requests
import os

def lambda_handler(event, context):
    token = event['queryStringParameters']['Authorization']
    print(token)
    user_pool_id = os.environ.get('USER_POOL_ID')
    region = 'us-east-1'
    app_client_id = os.environ.get('APP_CLIENT_ID')
    keys_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
    
    # Download JWKs and transform them to a key dictionary
    response = requests.get(keys_url)
    keys = response.json()['keys']
    key_dict = {key['kid']: json.dumps(key) for key in keys}

    # Decode and validate the token
    headers = jwt.get_unverified_headers(token)
    print(key_dict)
    print(headers)
    key = json.loads(key_dict[headers['kid']])
    public_key = jwk.construct(key)
    print(public_key)

    # Validate the token
    try:
        claims = jwt.decode(token, public_key, algorithms=['RS256'], audience=app_client_id)
        print(claims)
        principalId = claims['sub']

        # Generate policy document
        policy_document = {
            'principalId': principalId,
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': event['methodArn']
                }]
            }
        }

        return policy_document
    except Exception as e:
        print(f'Token validation error: {str(e)}')