'use strict';

const socket = io();

const outputYou = document.querySelector('.output-you');
const outputBot = document.querySelector('.output-bot');
const outputSearch = document.querySelector('.output-search');
const imgSearch = document.querySelector('.img_search');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
const googleAssistantIndex = 20;//"Google 國語（臺灣）"

recognition.lang = 'zh-TW';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

document.querySelector('button').addEventListener('click', () => {
  recognition.start();
  // socket.emit('chat message', "測試");//debug use
  // socket.emit('chat message', "我要買最貴的奶茶");//debug use
  // socket.emit('chat message', "價格呢");//debug use
  // socket.emit('chat message', "幫我發廣告到群組");//debug use
  // socket.emit('chat message', "請問阿宏第五次在什麼時候");//debug use
  // socket.emit('chat message', "今天天氣如何?");//debug use
  // socket.emit('chat message', "幫我打給RJ");//debug use
  // socket.emit('chat message', "我明天有什麼行程");//debug use
  // socket.emit('chat message', "幫我買最熱賣的美白液");//debug use
  // socket.emit('chat message', "今天大安天氣如何?");//debug use
  // socket.emit('chat message', "幫我搜尋最熱門的橡皮筋");//debug use
});

recognition.addEventListener('speechstart', () => {
  console.log('Speech has been detected.');
});

recognition.addEventListener('result', (e) => {
  console.log('Result has been detected.');

  let last = e.results.length - 1;
  let text = e.results[last][0].transcript;

  outputYou.textContent = text;
  console.log('Confidence: ' + e.results[0][0].confidence);

  socket.emit('chat message', text);
});

recognition.addEventListener('speechend', () => {
  recognition.stop();
});

recognition.addEventListener('error', (e) => {
  outputBot.textContent = 'Error: ' + e.error;
});

// var voices = window.speechSynthesis.getVoices();
// var idx = 0;

function synthVoice(text) {
  console.log("synthVoice "+text);
  const synth = window.speechSynthesis;  
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = text;
  utterance.rate = 1.25;
  var voices = synth.getVoices();

  // for(let index = 0; index < voices.length; index++) {
  //   /*
  //   "Google US English"
  //   "Google 日本語"
  //   "Google 普通话（中国大陆）"
  //   "Google 粤語（香港）"
  //   "Google 國語（臺灣）"
  //   */

  //   //console.log(this.voices[index].name);
  //   if(voices[index].name == "Google 國語（臺灣）"){       
  //     //u.lang = 'zh-TW'; //這句絕對不要用
  //     //要使用Google中文語音的話請不要再用u.lang指定語言
  //     //不然可能又會被切回系統預設的中文語音
  //     console.log("Google 小姐"+index);
      
  //     break;
  //   }else{
  //     //如果沒有則使用預設中文語音
  //     console.log("預設中文語音");
  //     utterance.lang = 'zh-TW';
  //   }
  // }
  utterance.voice = voices[googleAssistantIndex];
  // console.log("utterance:"+JSON.stringify(utterance));
  synth.speak(utterance);
  // if (idx <= voices.length) {
  //   idx++;
  //   setTimeout(function() { synthVoice(text); }, 2000);
  // }    
}

// socket.on('bot reply', function(replyText) {
//   synthVoice(replyText);

//   if(replyText == '') replyText = '(...)';
//   outputBot.textContent = replyText;
// });

socket.on('search reply', function(replyText) {
  synthVoice(replyText);

  if(replyText == '') replyText = '抱歉，我聽不懂你的問題，請再說一次!';
  outputSearch.textContent = replyText;
});

socket.on('img reply', function(imgUrl) {

  if(imgUrl === '') 
    imgUrl = "https://cdn4.iconfinder.com/data/icons/flat-brand-logo-2/512/ibm-512.png";
  else
    console.log('Img has been change to '+imgUrl);
  // outputSearch.textContent = replyText;
  var oldImg = document.getElementById('img_search');
  var newImg = new Image();
  newImg.src = imgUrl;
  newImg.id = 'img_search';
  oldImg.parentNode.replaceChild(newImg, oldImg);

  
});
