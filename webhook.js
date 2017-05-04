const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
require('env2')('./config.env');
const apiai = require('apiai');
const apiai_app = apiai(process.env.APIAI_CLIENT);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



function receivedMessage(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfMessage = event.timestamp;
  const message = event.message;

  console.log('Received message for user %d and page %d at %d with message:',
      senderID, recipientID, timeOfMessage);
    // console.log(JSON.stringify(message));

  const messageId = message.mid;

  const messageText = message.text;
  console.log(message);
  const messageAttachments = message.attachments;

  if (messageText) {
    const apiai_request = apiai_app.textRequest(messageText, {
      sessionId: 'mp-bot',
    });

    apiai_request.on('response', (response) => {
      const responseText = response.result.fulfillment.speech;
        // console.log('response is ', response);
      console.log('responseText is ', responseText);
      sendTextMessage(senderID, responseText);
    });

    apiai_request.on('error', (error) => {
      console.log(error);
    });

    apiai_request.end();
  }
}


function sendTextMessage(recipientId, messageText) {
  const messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
  };
  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData,

  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const recipientId = body.recipient_id;
      const messageId = body.message_id;

      console.log('Successfully sent generic message with id %s to recipient %s',
        messageId, recipientId);
    } else {
      console.error('Unable to send message.');
      console.error(response);
      console.error(error);
    }
  });
}

app.post('/webhook', (req, res) => {

  const data = req.body;
  console.log('data is    ', data);

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach((entry) => {
      const pageID = entry.id;
      const timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach((event) => {
        if (event.message) {
          webhook.receivedMessage(event);
        } else {
          console.log('Webhook received unknown event: ', event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

module.exports = {
  callSendAPI,
  sendTextMessage,
  receivedMessage
}
