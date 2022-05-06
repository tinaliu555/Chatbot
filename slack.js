// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
// const functions = require('firebase-functions');
// const {WebhookClient} = require('dialogflow-fulfillment');
const requestLib = require('request');

// initialise DB connection
// const admin = require('firebase-admin');
// admin.initializeApp();
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
sendSlackMessage("測試....");
function sendSlackMessage(name) {
  let slackMessageBody = {
    // "username": "Alice",
    // "text": "New submission from: " + name,
    // "icon_url": "data:image/jpeg;base64,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",
    // "icon_emoji": ":bowtie:"
    
    "username": "Alice",
    "icon_url": "https://emoji.slack-edge.com/T27SFGS2W/ibmocc/8a52c5787b88236f.png",
    "icon_emoji": ":bowtie:",
    // "as_user": true,
    // "author_icon": "https://emoji.slack-edge.com/T27SFGS2W/hongtw1/dae7b28ed6d20936.png",
    "text": "New submission from: " + name,
    
    "attachments": [{
        "fallback": "This attachement isn't supported.",
        "title": "Chatbot testing",
        "color": "#87CEFA",
        "pretext": "文字",
        "author_name": "Taiwan Mobile bot",
        // "author_link": "https://www.hongkiat.com/blog/author/preethi/",
        "author_icon": "https://emoji.slack-edge.com/T27SFGS2W/hongtw1/dae7b28ed6d20936.png",//HONG
        // "fields": [{
        //     "title": "Members",
        //     "value": "Alice\nFelix",
        //     "short": true
        // }, {
        //     "title": "Category",
        //     "value": "momo",
        //     "short": true
        // }],
        // "mrkdwn_in": ["text", "fields"],
        // "text": "Just click the site names and start buying. Get *extra reduction with the offer code*, if provided.",
        "thumb_url": "https://emoji.slack-edge.com/T27SFGS2W/hongtw1/dae7b28ed6d20936.png",//HONG
        // "thumb_url": "https://emoji.slack-edge.com/T27SFGS2W/ibmbe/c426115a0a7f0579.gif",//bee
        "footer": "TaiwanMobile X IBM",
        "footer_icon": "https://emoji.slack-edge.com/T27SFGS2W/ibmocc/8a52c5787b88236f.png",//IBM
        // "ts": 123456789
    }]
  };
  
  requestLib.post({
    headers: {'content-type' : 'application/json'},
    url:     "https://hooks.slack.com/services/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",
    body:    JSON.stringify(slackMessageBody)
  }, function(error, response, body) {
    console.log('Slack notification response body: ' + JSON.stringify(body) + ', error: ' + error);
  });
}

 
// exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
//   const agent = new WebhookClient({ request, response });
//   console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
//   console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
//   function saveName(agent) {
//     const nameParam = agent.parameters.name;
//     const context = agent.getContext('awaiting_name_confirm');
//     const name = nameParam || context.parameters.name;
    
//     agent.add(`Thank you, ` + name + `!`);
//     sendSlackMessage(name);
    
//   //   return admin.database().ref('/names').push({name: name}).then((snapshot) => {
//   //   // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//   //   console.log('database write sucessful: ' + snapshot.ref.toString());
//   // });
//   }
  
//   function sendSlackMessage(name) {
//     let slackMessageBody = {
//       "username": "Get Name Chatbot",
//       "text": "New submission from: " + name,
//       "icon_emoji": ":tada:"
//     };
    
//     requestLib.post({
//       headers: {'content-type' : 'application/json'},
//       url:     "https://hooks.slack.com/services/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",
//       body:    JSON.stringify(slackMessageBody)
//     }, function(error, response, body) {
//       console.log('Slack notification response body: ' + JSON.stringify(body) + ', error: ' + error);
//     });
//   }

//   // Run the proper function handler based on the matched Dialogflow intent name
//   let intentMap = new Map();
//   intentMap.set('Get Name', saveName);
//   intentMap.set('Confirm Name Yes', saveName);
//   // intentMap.set('Confirm Name Yes', getName);
//   agent.handleRequest(intentMap);
// });
