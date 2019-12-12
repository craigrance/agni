//hsoSignUp function triggered by dynamodb stream
'use strict';

global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const AUTH_TYPE = require('aws-appsync/lib/link/auth-link').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const gql = require('graphql-tag');

AWS.config.update({
  region: process.env.REGION
});
const credentials = AWS.config.credentials;

const poolData = {
  UserPoolId: process.env.USER_POOL_ID,
  ClientId: process.env.CLIENT_ID
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const queryGetIpAddressList = gql(`
  query GetIpAddressList($input: GetIpAddressListInput!) {
    getIpAddressList(input: $input) {
      ipAddressList {
        ipAddress
      }
    }
  }`);

const mutationSetStatus = gql(`
  mutation SetStatus($input: SetStatusInput!) {
    setStatus(input: $input) {
      status
    }
  }`);

const client = new AWSAppSyncClient({
  url: process.env.END_POINT,
  region: process.env.REGION,
  auth: {
    type: AUTH_TYPE.AWS_IAM,
    credentials
  },
  disableOffline: true
});

exports.handler = (event, context, callback) => {
  event.Records.forEach(record => {
    if (record.eventName !== 'INSERT') {
      return;
    }
    console.log('eventName', record.eventName);
    console.log('DynamoDB Record: %j', record.dynamodb);
    console.log('heyhey', record.dynamodb.NewImage.ipAddress.S);

    const GetIpAddressListInput = {
      ipAddress: record.dynamodb.NewImage.ipAddress.S
    };
    let ipAddressCount;

    (async () => {
      await client.hydrated();

      const result = await client
        .query({
          query: queryGetIpAddressList,
          variables: { input: GetIpAddressListInput },
          fetchPolicy: 'network-only'
        })
        .catch(error => console.log(error));
      console.log(result.data.getIpAddressList.ipAddressList.length);
      console.log('yuyu', result.data);
      ipAddressCount = result.data.getIpAddressList.ipAddressList.length;
      console.log('ipaddresscount', ipAddressCount);
      if (ipAddressCount > process.env.ACCESS_LIMIT) {
        const SetStatusInput = {
          id: record.dynamodb.NewImage.id.S,
          createdDate: record.dynamodb.NewImage.createdDate.S,
          status: 'accessLimitExceeded'
        };
        console.log('SetStatusInput', SetStatusInput);

        await client
          .mutate({
            mutation: mutationSetStatus,
            variables: { input: SetStatusInput },
            fetchPolicy: 'no-cache'
          })
          .catch(error => console.log(error));
        return;
      }
      userPool.signUp(
        record.dynamodb.NewImage.regularUserName.S,
        record.dynamodb.NewImage.password.S,
        [],
        null,
        (error, result) => {
          if (error) {
            console.log(error);
            return;
          }
          console.log('user name is ', result);
        }
      );
    })();
  });
};

//presignup
exports.handler = (event, context, callback) => {
  const userName = event.userName.slice(96);
  const userNamePrefix = event.userName.slice(0, 96);
  console.log('usernameeee', userName);
  if (
    !userName.match(/^(?=.{3,22}$)(?=[a-z0-9]+_[a-z0-9]+$)/) ||
    !userNamePrefix.match(/^[a-f0-9]{96}$/)
  ) {
    callback(new Error('invalid fullUserName'), event);
  } else {
    event.response.autoConfirmUser = true;
    callback(null, event);
  }
};

/* layer package.json
{
  "dependencies": {
    "apollo-cache-inmemory": "^1.1.0",
    "apollo-client": "^2.0.3",
    "apollo-link": "^1.0.3",
    "apollo-link-http": "^1.2.0",
    "aws-sdk": "^2.141.0",
    "aws-appsync": "^1.0.0",
    "es6-promise": "^4.1.1",
    "graphql": "^0.11.7",
    "graphql-tag": "^2.5.0",
    "isomorphic-fetch": "^2.2.1",
    "ws": "^3.3.1",
    "amazon-cognito-identity-js": "^3.2.0"
  }
}
*/
