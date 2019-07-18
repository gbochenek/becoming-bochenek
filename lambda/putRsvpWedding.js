// import entire SDK
const AWS = require("aws-sdk");

exports.handler = async event => {
  // Set the region
  AWS.config.update({ region: "us-east-1" });

  console.log("EVENT", event);

  // Create the DynamoDB service object
  const ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
  const key = {
    "guest-id": { S: event["guest-id"] }
  };

  const getParams = {
    Key: key,
    TableName: "wedding-guests"
  };

  console.log("GetParams", getParams);

  const getResp = await ddb
    .getItem(getParams, function(err, data) {
      if (err) {
        return err;
      } else {
        return data;
      }
    })
    .promise();

  const item = getResp.Item;

  console.log("ITEM", item);

  const params = {
    TableName: "wedding-guests",
    Key: key,
    UpdateExpression: "SET rsvp=:rsvp,fowl=:fowl,chile=:chile,kids=:kids",
    ExpressionAttributeValues: {
      ":rsvp": { BOOL: event.rsvp },
      ":fowl": { N: event.fowl ? event.fowl : "0" },
      ":chile": { N: event.chile ? event.chile : "0" },
      ":kids": { N: event.kids ? event.kids : "0" }
    }
  };

  // Call DynamoDB to add the item to the table
  const results = await ddb
    .updateItem(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        return err;
      } else {
        console.log("Success", data);
        return data;
      }
    })
    .promise();

  console.log(results);
  const sns = new AWS.SNS();
  const guestNames = item["guest-names"].SS;
  const rsvpNames = guestNames.join(" and ");
  const rsvpConnector = guestNames.length > 1 ? "are" : "is";
  const rsvpMessage = `${rsvpNames} ${rsvpConnector} coming to the wedding! They want ${
    event.fowl
  } cornish game hen plates, ${event.chile} chile plates, and ${
    event.kids
  } kids' plates!`;

  const messageArn = "arn:aws:sns:us-east-1:753748800816:wedding-rsvp";
  const noRsvpMessage = `${rsvpNames} ${rsvpConnector} not  coming to the wedding. :(`;
  const rsvpText = event.rsvp ? rsvpMessage : noRsvpMessage;
  console.log(`Publishing ${rsvpText}`);
  const snsParams = {
    Message: `${rsvpText} \n\n"${event.message}"`,
    TopicArn: messageArn
  };
  const notificationStatus = await sns
    .publish(snsParams, function(err, data) {
      if (err) {
        console.log("ERR", err);
        return err;
      } else {
        console.log("Message published", data);
        return data;
      }
    })
    .promise();

  console.log("NOTIFICATION", notificationStatus);
  const response = {
    statusCode: 200,
    body: { success: true }
  };
  return response;
};
