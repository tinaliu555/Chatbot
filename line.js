// https://medium.com/pyradise/%E4%BD%BF%E7%94%A8node-js%E5%BB%BA%E7%BD%AE%E4%BD%A0%E7%9A%84%E7%AC%AC%E4%B8%80%E5%80%8Bline-bot-590b7ba7a28a
// https://developers.line.biz/console/channel/1653726134/basics
// 引用linebot SDK
var linebot = require('linebot');

// 用於辨識Line Channel的資訊
var bot = linebot({
  channelId: '1653726134',
  channelSecret: 'f115c9818c00bd1619a1590c9845ee97',
  channelAccessToken: 'uX1NUIUDBhnAlosk9c3fOt0nbqaz/8ObyGnzFURSb0VQY1BQ8uPjbuA32YgRqUw3DY4bMNu8wdze7Rj4v9IBh6vEEgdI7BRvON0elnkryXFWatCGFKpSPby3rRaJNs0smCnuZV//ItsQmRQhxiA1kAdB04t89/1O/w1cDnyilFU='
});

// 當有人傳送訊息給Bot時
bot.on('message', function (event) {
  // event.message.text是使用者傳給bot的訊息
  // 使用event.reply(要回傳的訊息)方法可將訊息回傳給使用者
  event.reply(event.message.text).then(function (data) {
    // 當訊息成功回傳後的處理
  }).catch(function (error) {
    // 當訊息回傳失敗後的處理
  });
});

// Bot所監聽的webhook路徑與port
bot.listen('/linewebhook', 3000, function () {
    console.log('[BOT已準備就緒]');
});