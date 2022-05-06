'use strict';

require('dotenv').config()
// const APIAI_TOKEN = process.env.APIAI_TOKEN;
// const APIAI_SESSION_ID = process.env.APIAI_SESSION_ID;

const APIAI_TOKEN='eb22d927e6f847eead5d2954fff072b5'//Alice
const APIAI_SESSION_ID='taiwanmobile-ydiish'

// Package
const express = require('express');
const app = express();
var Enum = require('enum');
var http = require("https");// require nodeJS 內建 http 模組.
var fs = require("fs");// require nodeJS 內建 File System 模組.
const requestLib = require('request');// requre nodeJS 內建request模組

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

// Weather searching parameters
var weather_search_is_city = true;
var weather_search_now = true;
var search_weather_type = "Wx,MinT,MaxT,CI";//For city_1 and city_2
var search_weather_dict_type = "Wx,WeatherDescription";//For dict
var city_1 = ['臺北', '新北', '桃園', '臺中' ,'臺南', '高雄', '基隆', '新竹', '嘉義'];
var city_2 = ['新竹', '苗栗', '彰化', '南投' ,'雲林', '嘉義', '屏東', '宜蘭', '花蓮', '臺東', '澎湖', '金門', '連江'];
var dict = ['北投','士林','內湖','中山','大同','松山','南港','中正','萬華','信義','大安','文山'];

//User Record
let userFile = 'Database/Alice.json'
let rawdata = fs.readFileSync(userFile);
let userProfile = JSON.parse(rawdata);
console.log(userProfile);

//Information Record
let info_database = 'Database/DatabaseInfo.json'
rawdata = fs.readFileSync(info_database);
let info_Database_Profile = JSON.parse(rawdata);

// var record_location = userProfile.location;//"信義區";
// var record_product = userProfile.last_buy;
// console.log("record_location:"+ record_location+", record_product:"+record_product);

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
    console.log('--------------------------------------------------------');
    console.log('Message receive: ' + text);
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
      
      if(aiIntent === "momo_shopping" || aiIntent === "cheaper product"){
        let adj_product = "";
        let original_adj = "合適";
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
          let aiParameter_product;
          if(aiIntent === "momo_shopping"){
            aiParameter_product = response.result.parameters.product;
          }else{
            // aiParameter_product = record_product;//debug
            aiParameter_product = userProfile.last_buy;
          }
          // console.log('Reply aiParameter_product:[' + aiParameter_product+"]");
          if(!isNullOrEmpty(aiParameter_product)){
            getProductFromMomo(aiParameter_product,getSearchOrderToMomo(adj_product),original_adj,"Buy");
            // record_product = aiParameter_product;//debug
            userProfile.last_buy = aiParameter_product;
            updateRecord();
          }else {
            throw new UserException('InvalidProduct');
          }
          
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          if( hasSubString(text,"的")||hasSubString(text,"買")||hasSubString(text,"購")||hasSubString(text,"訂")||hasSubString(text,"找")||hasSubString(text,"查")||hasSubString(text,"搜")||hasSubString(text,"尋")){
            // console.log("hasSubString=true");
            getProductFromMomo(text.substring(find_index+1),getSearchOrderToMomo(adj_product),original_adj,"Buy");
            // record_product = text.substring(find_index+1);//debug
            userProfile.last_buy = text.substring(find_index+1);
            updateRecord();
          }else{
            console.log("searchQuery is empty!!!!!!!!!!!!!!!!!!");
            socket.emit('search reply', aiText);
          }
        }     
      }else if(aiIntent === "payment"){
        try{
          phoneRequest("message");
          socket.emit('search reply', "那我幫你送到您"+ userProfile.location +
          "的家，地址為" + userProfile.address + "並且使用" + userProfile.payment + "付款，可以嗎?");
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', aiText);
        }   
      }else if(aiIntent === "recommend"){
        try{
          getProductFromMomo(userProfile.followProduct,userProfile.searchPreference,"合適","Recommend");
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', aiText);
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
          // userProfile.location = "大安";
          // updateRecord();
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', aiText);
        }
        
      }else if(aiIntent === "send message"){
        try{
          console.log("Send message request!");
          phoneRequest("message");
          socket.emit('search reply', "已幫您向RJ請假!");
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', aiText);
        }
        socket.emit('img reply', "");
      }else if(aiIntent === "phone call"){
        try{
          console.log("Send phone call request!");
          phoneRequest("call");
          socket.emit('search reply', "正在幫您撥打中，請稍後!");
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', aiText);
        }
        socket.emit('img reply', "");
      }else if(aiIntent === "send slack"){
        try{
          console.log("Send message to slack!");
          sendSlackMessage("今天天氣真好....");
          socket.emit('search reply', "已幫您發送!");
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', aiText);
        }
        socket.emit('img reply', "");
      }else if(aiIntent === "latest calender"){
        try{
          let aiParameter_time = response.result.parameters.time;
          console.log('Reply aiParameter_time: ' + aiParameter_time);
          getCalender("",aiParameter_time);
        }catch(e){
          console.log("No specific time!");
          getCalender("","");
          console.log(e.message, e.name); // pass exception object to err handler
        }        
        socket.emit('img reply', "");
      }else if(aiIntent === "search calender"){
        try{
          let aiParameter_event = response.result.parameters.event;
          getCalender(aiParameter_event);
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', "不好意思我聽不清楚，請在講一次你想查詢的活動!");
        }        
        socket.emit('img reply', "");
      }else if(aiIntent === "what time is it"){
        socket.emit('search reply', getTimeNowText());
        socket.emit('img reply', "");
      }else if(aiIntent === "Ask ibm information"){
        // socket.emit('search reply', getTimeNowText());
        try{
          let aiParameter_event = response.result.parameters.event;
          let query_index = getNumber(text);
          console.log("getNumber #index:"+query_index);
          let responseString = getInfo(aiParameter_event,query_index,text);
          socket.emit('search reply', responseString);
          console.log('[getInfo] search reply', responseString); 
        }catch(e){
          console.log(e.message, e.name); // pass exception object to err handler
          socket.emit('search reply', "資料庫中沒有您想查詢的資料!");
          socket.emit('img reply', "");
        }
      }else{
        console.log("No match intent for customize!");
        socket.emit('search reply', aiText);
        socket.emit('img reply', "");
      }
    });

    apiaiReq.on('error', (error) => {
      console.log(error);
    });

    apiaiReq.end();
    clearParameters();

  });

  // 到Momo手機板官網爬商品資訊
  // overall:總和排序, cheapFirst:價格有低到高, expensiveFirst:價格有高到低, sellFirst:銷量排行
  // python momo.py 衛生紙 overall/cheapFirst/expensiveFirst/sellFirst
  function getProductFromMomo(product,adjProduct,org_adjProduct,task){
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
        if(isNullOrEmpty(org_adjProduct))
          org_adjProduct = "合適";
        var responseString;
        if(task==="Recommend") {
          responseString = "好的。你追蹤的產品「"+product +"」在特價中，只要"+result.price+"元，有需要幫你一起下訂嗎";

        }else{
          responseString = "我幫你找到最"+org_adjProduct+"的"+product+"為"+result.name+"，售價為"+result.price+"元";
        }
        socket.emit('search reply', responseString);
        console.log('[getProductFromMomo] search reply', responseString);          
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
            let icon_Url;
            if(weather_search_is_city){
              search_time = weather_search_now? 0 :2;
              weather_element = data.records.location[0].weatherElement;
              // console.log('[weather] weather_element:'+JSON.stringify(weather_element));
              // console.log('[weather] parameterName:'+weather_element[0].time[search_time].parameter.parameterName);
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
              // console.log('[weather] time:'+JSON.stringify(weather_element[0].time[search_time]));
              // console.log('[weather] parameterName:'+weather_element[0].time[search_time].elementValue[0].value);
              search_weather = new weather_city(weather_search_is_city, search_location,
                weather_element[0].time[search_time].elementValue[0].value, "", "",
                weather_element[1].time[search_time].elementValue[0].value);
            }
            console.log("search_weather.wx:"+search_weather.wx);
            icon_Url = getWeatherIcon(search_weather.wx);
            console.log("[weather] search_time :" + search_time);     
            console.log("[weather] class :" + search_weather.present());
            let responseString = search_weather.present();
            if(weather_search_now)
              responseString = getTimeNowText() + responseString;
            socket.emit('search reply', responseString);
            socket.emit('img reply', icon_Url);
          }catch(e){
            console.log(e.message, e.name); // pass exception object to err handler
            socket.emit('search reply', "目前無法查詢此地區氣候!");
            socket.emit('img reply', "");
          }
      });
    }).on('error', function(e){ // http get 錯誤時
        console.log("error: ", e);
    });

  }
  
  // 串接Google calender
  // 當關鍵字是空白，就表示搜尋所有活動
  // python calender.py ""/"關鍵字"/"IBM"
  function getCalender(event_query,time_query){
    var spawn = require('child_process').spawn,
    py    = spawn('python', ['calender.py',event_query]);
    console.log("[getCalender] command: python calender.py "+event_query);
    py.stdout.on('data', function(data){
      dataString = data.toString();
    });
    py.stdout.on('end', function(){      
      var results;
      try {
        results = JSON.parse(dataString);
        var responseString = getRecentCalender(results,time_query);
        // console.log('[getCalender] search reply1', responseString);
        socket.emit('search reply', responseString);
        console.log('[getCalender] search reply', responseString);
      } catch (e) {
        console.log(e.message, e.name); // pass exception object to err handler
        console.log('[getCalender] result is not JSON, '+dataString);
      } 
      return;
    });
  }

});

//https://www.developer.aero/Weather-API/Weather-API-Documentation/Weather-Developers-Documentation/Weather-Icons
//https://opendata.cwb.gov.tw/opendatadoc/MFC/D0047.pdf
function getWeatherIcon(desc){
  let iconIndex = "07";//default Cloudy (AM and PM)
  console.log("[getWeatherIcon] desc:"+desc);
  if(hasSubString(desc,"雨")){
    if(hasSubString(desc,"雷")){
      iconIndex = "16";//Mostly Cloudy with Thunder Showers
    }else if(hasSubString(desc,"雲")){
      iconIndex = "13";//Mostly Cloudy with Showers
    }else if (hasSubString(desc,"晴")){
      iconIndex = "14";//Partly Sunny with Showers
    }else{
      iconIndex = "12";//Showers (AM and PM)
    }
  }else{
    if(hasSubString(desc,"雷")){
      iconIndex = "15";//Thunderstorms (AM and PM)
    }else if(hasSubString(desc,"霧")){
      iconIndex = "11";//Fog (AM and PM)
    }else if (hasSubString(desc,"雲")&& hasSubString(desc,"晴"))
      iconIndex = "06";//	Mostly Cloudy
    else if (hasSubString(desc,"晴"))
      iconIndex = "01";//Sunny
    else if (hasSubString(desc,"風"))
      iconIndex = "32";//	Windy (AM and PM)
  }
 
  return "http://uds-static.api.aero/weather/icon/lg/"+iconIndex+".png";
}

// 發簡訊/打電話/兩者都要
// python send_message.py message/call/both
function phoneRequest(userOption){
  var spawn = require('child_process').spawn,
  py = spawn('python', ['sending_message.py',userOption]);
  console.log("[phoneRequest] command: python sending_message.py "+userOption);
  py.stdout.on('data', function(data){
    dataString = data.toString();
    // console.log("dataString:"+dataString);
  });
  py.stdout.on('end', function(){      
    console.log('[phoneRequest] status: success');
    return;
  });
}


// Utils
function hasSubString(orgString,subString){
  // console.log('orgString='+orgString+' ,subString= ' + subString);
  if(isNullOrEmpty(orgString)|| isNullOrEmpty(subString))
    return false;

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
    return checkLocation(rep_location.substring(0,2));
  }else if(rep_location.length==2){
    if(city_1.includes(rep_location)) {      
      return_location += "市";
    }else if(city_2.includes(rep_location)) {
      return_location += "縣";
    }else{
      weather_search_is_city = false;
      return_location += "區";
    }
  }else if(rep_location[2]==="區"){
    weather_search_is_city = false;
  }else if (isNullOrEmpty(rep_location)){
    weather_search_is_city = false;
    // return_location = record_location;//debug
    return_location = checkLocation(userProfile.location);
  }
  return return_location;
}

// Return 搜尋的排序條件
function getSearchOrderToMomo(adj_product){
  console.log('[getSearchOrderToMomo] adj_product: ' + adj_product);
  switch (adj_product) {
    case "便宜":
      return "cheapFirst";
    case "貴":
      return "expensiveFirst";
    case "暢銷":
      return "sellFirst"; 
    case "綜合":
      return "overall";
    case "":
        return userProfile.searchPreference;
    default:
      // return "overall";
      return userProfile.searchPreference;
  }
}

// Return 現在時間
function getTimeNowText(){
  var today = new Date();
  return "現在時間是" + today.getHours() + "點" + today.getMinutes() + "分。";
}

function getToday(){
  return new Date();
}

function getRecentCalender(results,time_query){
  var length = results.length-1;
  if(length<0 ||isNullOrEmpty(results)){
    return "您的行事曆沒有該活動!";
  }
  console.log("time_query=　"+time_query);
  var queryTime_month="";
  var queryTime_day="";
  if(time_query==="明天"){
    console.log("time_query=明天　->"+time_query);
    queryTime_month = getToday().getMonth()+1;
    queryTime_day = getToday().getDate()+1;
    console.log("time_query=明天　->"+time_query+" "+queryTime_month+"/"+queryTime_day);
    for(var i=0; i<=length; i++){
      if(results[i].month!=queryTime_month ||　results[i].day!=queryTime_day){
        length=i-1;
        break;
      }
    }
  }else if(time_query==="今天"){
    queryTime_month = getToday().getMonth()+1;
    queryTime_day = getToday().getDate();    
    console.log("time_query=今天　->"+time_query+" "+queryTime_month+"/"+queryTime_day);
    for(var i=0; i<=length; i++){
      if(results[i].month!=queryTime_month ||　results[i].day!=queryTime_day){
        length=i-1;
        break;
      }
    }
  }
  
  var displayTime = isNullOrEmpty(time_query)? "最近"　: time_query;
  console.log('[getRecentCalender] result is '+JSON.stringify(results)+", length:"+length);
  let responseString = "您"+displayTime+"一共有"+(length+1)+"筆活動。";
  try{
    for(var i=0; i<=Math.min(length,3); i++){
      responseString += "第"+(i+1)+"個活動在"+results[i].month+"月"+results[i].day+"日";
      if(results[i].AmOrPm==="AM")
        responseString += "上午";
      else
        responseString += "下午";
        responseString += results[i].hour +"點"+results[i].min+"分，名稱為"+results[i].event+"。";
    }
  }catch(e){
    console.log(e.message, e.name); // pass exception object to err handler
  }
  console.log("[getRecentCalender] responseString:"+responseString);
  return responseString;
}

// 組發送到slack的訊息內容
function setSlackJson(text){
  let slackMessageBody = {  
    "attachments": [{
      "fallback": "This attachement isn't supported.",
      "title": "Dear all \n 有誰明天想跟我去雲門舞集!! \n請假就對了!\n__",
      "color": "#87CEFA",
      "pretext": "",
      //"author_name": "Felix Kuan",
      // "author_link": "https://www.hongkiat.com/blog/author/preethi/",
      //"author_icon": "https://static.newmobilelife.com/wp-content/uploads/2018/02/line4-2-e1519196104129.jpg",//HONG
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
       "text": "\n\n #2019年的Flexiable holiday 還可以用到1月31日\n#請假不用假裝肚子痛 ",
      "thumb_url": "https://static.newmobilelife.com/wp-content/uploads/2018/02/line4-2-e1519196104129.jpg",//HONG
      // "thumb_url": "https://emoji.slack-edge.com/T27SFGS2W/ibmbe/c426115a0a7f0579.gif",//bee
      "footer": "  宇宙最強的 IBM智慧音箱",
      "footer_icon": "https://emoji.slack-edge.com/T27SFGS2W/ibmocc/8a52c5787b88236f.png",//IBM

      // "ts": 123456789
    }]
  };
  
  return slackMessageBody;
}

function sendSlackMessage(text) { 
  requestLib.post({
    headers: {'content-type' : 'application/json'},
    url:     "https://hooks.slack.com/services/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",
    body:    JSON.stringify(setSlackJson(text))
  }, function(error, response, body) {
    console.log('[sendSlackMessage] Slack notification response body: ' + JSON.stringify(body) + ', error: ' + error);
  });
}

// 查詢資料庫
function getInfo(event_query,number_query,whole_query){    
  if(event_query==="阿宏之聲"){
    if(hasSubString(whole_query,"介紹")||hasSubString(whole_query,"誰主持")){
      return info_Database_Profile.Info.HongTalk.intro;
    }
    var len = info_Database_Profile.Info.HongTalk.content.length;
    if(number_query!=-1 && number_query-1 < len){
      return "第"+ number_query +"次的阿宏之聲在"+ info_Database_Profile.Info.HongTalk.time[number_query-1] +
      "，主題為" + info_Database_Profile.Info.HongTalk.content[number_query-1];
    }else{
      return "抱歉，資料庫目前只收錄到阿宏之聲第"+len+"期!";
    }
  }else if(event_query==="轉轉櫃"){
    return info_Database_Profile.Info.NewHire.box;
  }else if(event_query==="名片"){
    return info_Database_Profile.Info.NewHire.businessCard;
  }
  return "目前查無相關資料";
}

// 找到真正的數字
function getNumber(string_query){
    if (hasSubString(string_query,"十")){
      let subString= string_query.substring(find_index+1);
      let repNumber = getNumber(subString);
      if(repNumber===-1)// 只有"十"
        return 10;
      else{//"十"後面還有數字
        return parseInt(repNumber)+ 10;
      }
    }
    else if(hasSubString(string_query,"一"))
      return 1;
    else if (hasSubString(string_query,"二"))
      return 2;
    else if (hasSubString(string_query,"三"))
      return 3;
    else if (hasSubString(string_query,"四"))
      return 4;
    else if (hasSubString(string_query,"五"))
      return 5;
    else if (hasSubString(string_query,"六"))
      return 6;
    else if (hasSubString(string_query,"七"))
      return 7;
    else if (hasSubString(string_query,"八"))
      return 8;
    else if (hasSubString(string_query,"九"))
      return 9;
    else 
      return -1;    
}

function updateRecord(){
  let data = JSON.stringify(userProfile);
  fs.writeFileSync(userFile, data);
}


