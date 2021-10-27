// @ts-nocheck
const axios = require('axios')
const aws = require('aws-sdk')
const client = new aws.SecretsManager({
    region: 'us-east-2'
});

const sesClient = new aws.SES()

const url = 'http://checkip.amazonaws.com/';
let response;

exports.lambdaHandler = async (event, context) => {

  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);
 
  // Get id from pathParameters from APIGateway because of `/{id}` at template.yml
  const city = event.queryStringParameters.city
  const state = event.queryStringParameters.state
  const country = event.queryStringParameters.country

    const mapIDsecret = await client.getSecretValue({
        SecretId: 'mapID9812'
    }).promise()

    const openmapKey = JSON.parse(mapIDsecret.SecretString)

    const airqualityIDsecret = await client.getSecretValue({
      SecretId: 'air9812'
    }).promise()

  const airQualityKey = JSON.parse(airqualityIDsecret.SecretString)

    try {
        const airQualityResponse = await axios(`http://api.airvisual.com/v2/city?city=${city}&state=${state}&country=${country}&key=${airQualityKey.airvisualAPI}`);

        const airQualityLatandLong = airQualityResponse.data.data.location.coordinates

        const airPollutionResponse = await axios(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${airQualityLatandLong[0]}&lon=${airQualityLatandLong[1]}&appid=${openmapKey.weathermapappID}`)
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                airQuality: airQualityResponse.data,
                airpollution: airPollutionResponse.data
            })
        }

        console.log(response)

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
        
        // await sesClient.sendEmail(emailParams).promise()
        
    } catch (err) {
        console.log(err);
        return err;
    }

    return response

};
