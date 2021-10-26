// @ts-nocheck
const axios = require('axios')
const aws = require('aws-sdk')
let FormData = require('form-data');
let data = new FormData();
const client = new aws.SecretsManager({
    region: 'us-east-2'
});

const sesClient = new aws.SES()

const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {



    const result = await client.getSecretValue({
        SecretId: 'airqualityapi'
    }).promise()

    const airAPI = JSON.parse(result.SecretString)

    const config = {
      method: 'get',
      url: `http://api.airvisual.com/v2/countries?key=${airAPI.AIR_QUALITY_API_KEY}`,
      headers: { 
        ...data.getHeaders()
      },
      data : data
    };

    try {
        const ret = await axios(url);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
                location: ret.data.trim(),
                test: 'test',
                code: airAPI.AIR_QUALITY_API_KEY
            })
        }

        const emailParams = {
            Source: 'ysandeepkumar88@gmail.com', 
            Destination: {
              ToAddresses: ['ysandeepkumar88@gmail.com'], 
            },
            Message: {
              Body: {
                Text: {
                  Charset: 'UTF-8',
                  Data: `Test`,
                },
              },
              Subject: {
                Charset: 'UTF-8',
                Data: 'AWS SES - email',
              },
            },
        };
    
        await sesClient.sendEmail(emailParams).promise()
        
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
