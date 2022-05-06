'use strict';

require('dotenv').config()
// const APIAI_TOKEN = process.env.APIAI_TOKEN;
// const APIAI_SESSION_ID = process.env.APIAI_SESSION_ID;

const APIAI_TOKEN='eb22d927e6f847eead5d2954fff072b5'//Alice
const APIAI_SESSION_ID='taiwanmobile-ydiish'
// console.log("APIAI_TOKEN: "+APIAI_TOKEN)
const express = require('express');
const app = express();

app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

const io = require('socket.io')(server);
io.on('connection', function(socket){
  console.log('a user connected');
});

const apiai = require('apiai')(APIAI_TOKEN);
var dataString = '';

// Web UI
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

//Alice parameters
var find_index = -1;
var find_st = -1;
var find_ed = -1;

// Package
var Enum = require('enum');
var http = require("https");// require nodeJS 內建 http 模組.
var fs = require("fs");// require nodeJS 內建 File System 模組.

// Weather searching parameters
var weather_search_is_city = true;
var weather_search_now = true;
var search_weather_type = "Wx,MinT,MaxT,CI";//For city_1 and city_2
var search_weather_dict_type = "Wx,WeatherDescription";//For dict
var city_1 = ['臺北', '新北', '桃園', '臺中' ,'臺南', '高雄', '基隆', '新竹', '嘉義'];
var city_2 = ['新竹', '苗栗', '彰化', '南投' ,'雲林', '嘉義', '屏東', '宜蘭', '花蓮', '臺東', '澎湖', '金門', '連江'];
var dict = ['北投','士林','內湖','中山','大同','松山','南港','中正','萬華','信義','大安','文山'];

//Record
var record_location = "信義區";

function UserException(message) {
  this.message = message;
  this.name = 'UserException';
}

class weather_city {
  constructor(isCity, city, wx,temp_min, temp_max,disc) {
    this.isCity = isCity;
    this.city = city;
    this.wx = wx;
    this.temp_min = temp_min;
    this.temp_max = temp_max;
    this.disc = disc;
  }
  present() {
    if(this.isCity){
      return this.city + "的天氣為" + this.wx + "，溫度為" + this.temp_min + "到" + this.temp_max + "之間" ;
    }
    else 
      return this.city + "的天氣為" + this.disc.replace("���", "速").replace("��","級").replace(" ", "");
  }
}

io.on('connection', function(socket) {
  socket.on('chat message', (text) => {
    console.log('Message receive: ' + text+'------------------------------');
    // Get a reply from API.ai
    let apiaiReq = apiai.textRequest(text, {
      sessionId: APIAI_SESSION_ID
    });
    
    apiaiReq.on('response', (response) => {
      //https://cloud.google.com/dialogflow/docs/migrating?hl=zh-tw
      let aiText = response.result.fulfillment.speech;
      let aiIntent = response.result.metadata.intentName;
      let aiMessages = response.result.fulfillment.messages;
      
      console.log('Bot reply: ' + aiText);
      console.log('Reply response: ' + JSON.stringify(response));
      // console.log('Reply response (json): ' + res.json(response));
      console.log('Reply intent: ' + aiIntent);
      console.log('Reply aiMessages: ' + JSON.stringify(aiMessages));
      // console.log('Reply aiMessages (json): ' + res.json(aiMessages));
      
      if(aiIntent === "buy"){
        let adj_product = "";
        let original_adj = "";
        try {
          console.log('response.result.parameters: ' +  JSON.stringify(response.result.parameters));
          adj_product = response.result.parameters.adjProduct;
          // original_adj = response.result.parameters.adjProduct.original;
          original_adj = adj_product
          console.log('adj_product: '+adj_product);
        }catch(e){
          original_adj = "合適"
          console.log("adj_product is empty!!!!!!!!!!!!!!!!!!");
        }
        try {
          let aiParameter_product = response.result.parameters.product;
          // console.log('Reply aiParameter_product:[' + aiParameter_product+"]");
          if(!isNullOrEmpty(aiParameter_product)){
            getProductFromMomo(aiParameter_product,getSearchOrderToMomo(adj_product),original_adj);
          }else {
            throw new UserException('InvalidProduct');
          }
          
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          if( hasSubString(text,"的")||hasSubString(text,"買")||hasSubString(text,"購")||hasSubString(text,"訂")){
            // console.log("hasSubString=true");
            getProductFromMomo(text.substring(find_index+1),getSearchOrderToMomo(adj_product),original_adj);
          }else{
            console.log("searchQuery is empty!!!!!!!!!!!!!!!!!!");
            socket.emit('bot reply', aiText);
          }
        }        
      }else if (aiIntent === "How's the weather tommorow?"){
        try{
          let aiParameter_location = response.result.parameters.location;
          console.log('Reply aiParameter_product: ' + aiParameter_location);
          if(hasSubString(text,"明")){
            weather_search_now = false;
          }else if(hasSubString(text,"今")||hasSubString(text,"現在")){
            weather_search_now = true;
          }else{
            weather_search_now = false;
          }       
          
          if( isNullOrEmpty(aiParameter_location)){
            aiParameter_location = searchForLocation(text);
            console.log("[searchForLocation] aiParameter_location:"+aiParameter_location);
          } 
          getWeather(checkLocation(aiParameter_location));
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('bot reply', aiText);
        }
      }else{
        console.log("No match intent for customize!");
        socket.emit('bot reply', aiText);
      }
    });

    apiaiReq.on('error', (error) => {
      console.log(error);
    });

    apiaiReq.end();
    clearParameters();

  });

  function getProductFromMomo(product,adjProduct,org_adjProduct){
    //start.js
    var spawn = require('child_process').spawn,
    py    = spawn('python', ['momo.py',product,adjProduct]);
    console.log("[getProductFromMomo] command: python momo.py "+product+" "+adjProduct);
  
    var result;
    py.stdout.on('data', function(data){
      dataString = data.toString();
    });
    py.stdout.on('end', function(){      
      try {
        result = JSON.parse(dataString);
        console.log('[getProductFromMomo] result is '+JSON.stringify(result));

        socket.emit('search reply', "我幫你找到最"+org_adjProduct+"的"+product+"為"+result.name+"，售價為"+result.price+"元");
        console.log('[getProductFromMomo] search reply', "我幫你找到最合適的"+product+"為"+result.name+"，售價為"+result.price+"元");
          
        socket.emit('img reply', result.img_url);
        // console.log('[getProductFromMomo] img reply '+result.img_url);
      } catch (e) {
        console.log('[getProductFromMomo] result is not JSON');
      } 
      return;
    });
  }

  function getWeather(search_location){    
    let send_url;
    // 使用 http 中 get 方法
    let weather_city_url = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-CA4CC674-503D-4AB8-9424-B593BBC5A364&locationName="+search_location+"&elementName="+search_weather_type;
    // for taipei dict
    let weather_dict_url = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=CWB-CA4CC674-503D-4AB8-9424-B593BBC5A364&locationName="+search_location+"&elementName="+search_weather_dict_type;
    if(weather_search_is_city)
      send_url = weather_city_url;
    else
      send_url = weather_dict_url;
    console.log("Url: "+send_url);

    http.get(send_url, function(response){
      var data = '';
      // response event 'data' 當 data 陸續接收的時候，用一個變數累加它。
      response.on('data', function(chunk){
          data += chunk;
      });
      // response event 'end' 當接收 data 結束的時候。
      response.on('end', function(){
          // 將 JSON parse 成物件
          data = JSON.parse(data);          
          // console.log('[weather] data:'+JSON.stringify(data));
          try{
            let weather_element;
            let search_weather;
            let search_time = 0;
            if(weather_search_is_city){
              search_time = weather_search_now? 0 :2;
              weather_element = data.records.location[0].weatherElement;
              // console.log('[weather] weather_element:'+JSON.stringify(weather_element));
              console.log('[weather] parameterName:'+weather_element[0].time[search_time].parameter.parameterName);
              search_weather = new weather_city(weather_search_is_city, search_location,
                weather_element[0].time[search_time].parameter.parameterName,
                weather_element[1].time[search_time].parameter.parameterName,
                weather_element[3].time[search_time].parameter.parameterName,
                weather_element[2].time[search_time].parameter.parameterName);
            }else{
              search_time = weather_search_now? 0 : 8;
              // console.log('[weather] weather_element1:'+JSON.stringify( data.records));
              // console.log('[weather] weather_element:'+JSON.stringify( data.records.locations[0].location[0].weatherElement));
              weather_element = data.records.locations[0].location[0].weatherElement;
              // console.log('[weather] weather_element:'+JSON.stringify(weather_element));
              console.log('[weather] time:'+JSON.stringify(weather_element[0].time[search_time]));
              // console.log('[weather] parameterName:'+weather_element[0].time[search_time].elementValue[0].value);
              search_weather = new weather_city(weather_search_is_city, search_location,
                weather_element[0].time[search_time].elementValue[0].value, "", "",
                weather_element[1].time[search_time].elementValue[0].value);
            }
            console.log("[weather] search_time :" + search_time);     
            console.log("[weather] class :" + search_weather.present());
          
            socket.emit('search reply', getTimeNow()+search_weather.present());
          }catch(e){
            console.log(e.message, e.name); // pass exception object to err handler
            socket.emit('search reply', "目前無法查詢此地區氣候!");
          }
      });
    }).on('error', function(e){ // http get 錯誤時
        console.log("error: ", e);
    });

  }
});

// Utils
function hasSubString(orgString,subString){
    console.log('orgString='+orgString+' ,subString= ' + subString);
    var index = orgString.indexOf(subString);
    if(index==-1){
      return false;
    }else{
      find_index = index;
      console.log('find_index is ' + find_index);
      return true;
    }
}

function clearParameters(){
  find_index = -1;
  find_st = -1;
  find_ed = -1;
}

function isNullOrEmpty(value) {
  return value == null || value === "";
}

// 從用戶的話語中找出地區名稱
function searchForLocation(user_input){
  var loc;
  for (loc of city_1){
    if(user_input.includes(loc)){
      return loc;
    }
  }
  for (loc of city_2){
    if(user_input.includes(loc)){
      return loc;
    }
  }
  for (loc of dict){
    if(user_input.includes(loc)){
      return loc;
    }
  }
  return "";
}

// Return 正確格式的地區名稱 ex: XX市、XX縣、XX區
function checkLocation(location){
  let rep_location =  location.replace("台", "臺");
  console.log("[checkLocation] rep_location:"+rep_location);
  weather_search_is_city = true;
  let return_location = rep_location;
  if(rep_location.length==3){
    return checkLocation(location.substring(0,2));
  }else if(rep_location.length==2){
    if(city_1.includes(location)) {      
      return_location += "市";
    }else if(city_2.includes(location)) {
      return_location += "縣";
    }else{
      weather_search_is_city = false;
      return_location += "區";
    }
  }else if(rep_location[2]==="區"){
    weather_search_is_city = false;
  }else if (isNullOrEmpty(location)){
    weather_search_is_city = false;
    return_location = record_location;
  }
  return return_location;
}

// Return 搜尋的排序條件
function getSearchOrderToMomo(adj_product){
  console.log('[getSearchOrderToMomo] adj_product: ' + adj_product);
  switch (adj_product) {
    case "便宜":
      // console.log('[getSearchOrderToMomo]cheapFirst>adj_product: ' + adj_product);
      return "cheapFirst";
    case "貴":
      return "expensiveFirst";
    case "暢銷":
      return "sellFirst"; 
    case "":
        return "overall";
    default:
      // console.log('[getSearchOrderToMomo]default>adj_product: ' + adj_product);
      return "overall";
  }
}

// Return 現在時間
function getTimeNow(){
  var today = new Date();
  return "現在時間是" + today.getHours() + "點" + today.getMinutes() + "分。";
}

