const DYNAMODB = require("aws-sdk/clients/dynamodb");
const SNS = require("aws-sdk/clients/sns");

const sns = new SNS({
  region: "us-east-1",
});

const dynamodb = new DYNAMODB({
  region: "us-east-1",
});

function calculateAge(birthday) { 
  const birthDate = new Date(birthday)
  const ageDifMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

exports.handler = async (event) => {
  const body = event;

  if (!body.dni || !body.name || !body.lastName || !body.birth) {
    return {
      statusCode: 400,
      body: "Must include all attributes",
    };
  }

  if (calculateAge(body.birth) > 65) {
    return {
      statusCode: 400,
      body: "Client must be under 65 years old",
    };
  }

  const dbParams = {
    Item: {
      dni: {
        S: body.dni,
      },
      name: {
        S: body.name,
      },
      lastName: {
        S: body.lastName,
      },
      birth: {
        S: body.birth,
      },
    },
    ReturnConsumedCapacity: "TOTAL",
    TableName: "clients",
  };

  const snsParams = {
    Message: JSON.stringify(body),
    TopicArn: "arn:aws:sns:us-east-1:066987178365:client-created",
  };

  try {
    const dbResult = await dynamodb.putItem(dbParams).promise();
    console.info(dbResult);
    const snsResult = await sns.publish(snsParams).promise();
    console.info(snsResult);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: error,
    };
  }

  return {
    statusCode: 200,
    body: "Client added succesfully",
  };
};
