const axios = require('axios')
const aws = require('aws-sdk')
const client = new aws.SecretsManager({
    region: 'us-east-2'
});

const sesClient = new aws.SES()

let secret, decodedBinarySecret;
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




    client.getSecretValue({
        SecretId: 'samplesecret'
    }, function(err, data) {
        if (err) {
            throw err
        } else {
            if ('SecretString' in data) {
                secret = JSON.parse(data.SecretString);
            } else {
                // @ts-ignore
                let buff = new Buffer(data.SecretBinary, 'base64');
                decodedBinarySecret = buff.toString('ascii');
            }
        }
    })

    try {
        const ret = await axios(url);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
                location: ret.data.trim(),
                test: 'test',
                code: secret
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
