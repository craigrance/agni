'use strict';

global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const AUTH_TYPE = require('aws-appsync/lib/link/auth-link').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const gql = require('graphql-tag');
const credentials = AWS.config.credentials;

const poolData = {
  UserPoolId: process.env.USER_POOL_ID,
  ClientId: process.env.CLIENT_ID
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const mutationSetStatus = gql(`
  mutation SetStatus($input: SetStatusInput!) {
    setStatus(input: $input) {
      status
    }
  }`);

const queryGetIpAddressList = gql(`
  query GetIpAddressList($input: GetIpAddressListInput!) {
    getIpAddressList(input: $input) {
      ipAddressList {
        ipAddress
      }
    }
  }`);

const queryGetStatus = gql(`
  query GetStatus($input: GetStatusInput!) {
    getStatus(input: $input) {
      status
    }
  }`);

const client = new AWSAppSyncClient({
  url: process.env.END_POINT_SignUpUserInfo,
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

    let ipAddressCount;

    const commonSetStatusInput = {
      id: record.dynamodb.NewImage.id.S,
      createdDate: record.dynamodb.NewImage.createdDate.S
    };

    const getIpAddressListInput = {
      ipAddress: record.dynamodb.NewImage.ipAddress.S
    };

    const GetStatusInput = {
      id: record.dynamodb.NewImage.id.S,
      createdDate: record.dynamodb.NewImage.createdDate.S
    };

    (async () => {
      await client.hydrated();

      const queryGetStatusResult = await client
        .query({
          query: queryGetStatus,
          variables: { input: GetStatusInput },
          fetchPolicy: 'network-only'
        })
        .catch(async () => {
          await client
            .mutate({
              mutation: mutationSetStatus,
              variables: {
                input: { ...commonSetStatusInput, status: 'signUpError' }
              },
              fetchPolicy: 'no-cache'
            })
            .catch(() => {});
        });

      if (
        queryGetStatusResult.data.getStatus.status === 'beingProcessed' ||
        queryGetStatusResult.data.getStatus.status === 'hasSignedUp'
      ) {
        return;
      }

      await client
        .mutate({
          mutation: mutationSetStatus,
          variables: {
            input: { ...commonSetStatusInput, status: 'beingProcessed' }
          },
          fetchPolicy: 'no-cache'
        })
        .catch(() => {});

      const result = await client
        .query({
          query: queryGetIpAddressList,
          variables: { input: getIpAddressListInput },
          fetchPolicy: 'network-only'
        })
        .catch(async () => {
          await client
            .mutate({
              mutation: mutationSetStatus,
              variables: {
                input: { ...commonSetStatusInput, status: 'signUpError' }
              },
              fetchPolicy: 'no-cache'
            })
            .catch(() => {});
        });

      ipAddressCount = result.data.getIpAddressList.ipAddressList.length;

      if (ipAddressCount > process.env.ACCESS_LIMIT) {
        await client
          .mutate({
            mutation: mutationSetStatus,
            variables: {
              input: { ...commonSetStatusInput, status: 'accessLimitExceeded' }
            },
            fetchPolicy: 'no-cache'
          })
          .catch(() => {});
        return;
      }

      userPool.signUp(
        record.dynamodb.NewImage.fullUsername.S,
        record.dynamodb.NewImage.password.S,
        [],
        null,
        async (error, result) => {
          if (error) {
            await client
              .mutate({
                mutation: mutationSetStatus,
                variables: {
                  input: { ...commonSetStatusInput, status: 'signUpError' }
                },
                fetchPolicy: 'no-cache'
              })
              .catch(() => {});
            return;
          }
        },
        {
          id: record.dynamodb.NewImage.id.S,
          createdDate: record.dynamodb.NewImage.createdDate.S
        }
      );
    })();
  });
};
