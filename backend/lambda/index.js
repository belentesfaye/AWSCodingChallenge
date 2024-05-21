const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const Busboy = require("busboy");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        body: "",
      };
    }

    if (event.httpMethod === "POST") {
      const busboy = new Busboy({ headers: event.headers });
      const fields = {};
      const files = [];

      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const fileData = [];
        file.on("data", (data) => fileData.push(data));
        file.on("end", () => {
          files.push({ filename, mimetype, data: Buffer.concat(fileData) });
        });
      });

      busboy.on("field", (fieldname, value) => {
        fields[fieldname] = value;
      });

      busboy.on("finish", async () => {
        const id = nanoid();
        const s3Params = {
          Bucket: "your-bucket-name",
          Key: `input/${id}.input`,
          Body: files[0].data,
        };
        await s3.upload(s3Params).promise();

        const dynamoParams = {
          TableName: "CdkS3DynamodbLambdaTable",
          Item: {
            id,
            text: fields.text,
            path: `input/${id}.input`,
          },
        };
        await dynamoDB.put(dynamoParams).promise();

        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ id }),
        };
      });

      busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
      busboy.end();
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
