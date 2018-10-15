require('dotenv').config();
const Mastodon = require('mastodon-api');
const WebSocket = require('ws');
const fs = require('fs');
const moment = require('moment');
const ws = new WebSocket(`wss://pla.social/api/v1/streaming/?stream=user&access_token=${process.env.ACCESS_TOKEN}`);
const download = require('image-downloader')
const sanitizeHtml = require('sanitize-html');
const http = require('request');
const https = require('https');


console.log("Bot starting...")


//openweathermap("29486");


const accessTokenEncoded = encodeURIComponent(process.env.ACCESS_TOKEN);

const M = new Mastodon({
  access_token: process.env.ACCESS_TOKEN,
  client_secret: process.env.CLIENT_SECRET,
  client_key: process.env.CLIENT_KEY,
  timeout_ms: 60 * 1000,
  api_url: 'https://pla.social/api/v1/'
});

function httpGet(id, url, query) {
  https.get(url, (res) => { // <- this is a function that is called when there's a response. Waiting for a response is as easy as writing code inside this function (or use async await)
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    var body = '';
    res.on('data', (d) => { //this is a function attached to the response's 'data' event. it's called every time a chunk of data arrives. (multiple times per request)
      body += d;
    });
    res.on('end', () => {
      var weatherResponse = JSON.parse(body);
      if (weatherResponse.cod != '200') {
        var msg = `Weather lookup for: "${query}" failed with error: ${weatherResponse.message}`;
        console.log(msg);
        toot(msg, id);
        return;
      }
      fs.writeFileSync(`weather_${moment().format("YYY_MM_DD_HH_mm_ss")}.json`, JSON.stringify(weatherResponse, null, 2));
      var f = fahrenheit(weatherResponse.main.temp);
      var sunrise = new Date(weatherResponse.sys.sunrise * 1000);
      var sunset = new Date(weatherResponse.sys.sunset * 1000);
      var date = new Date(weatherResponse.dt * 1000);
      var msg = `Weather for ${weatherResponse.name}\nTemperature: ${weatherResponse.main.temp}°C ${f}°F\nConditions: ${weatherResponse.weather[0].main}\nSunrise: ${sunrise.toUTCString()}\nSunset: ${sunset.toUTCString()}\nDate: ${date.toUTCString()}`;
      console.log(msg);
      toot(msg, id);
    });

  }).on('error', (e) => { //the https.get function returns a request that can emit an error event. this is an eventlistener for that. try an invalid url to test this branch of your code
    console.error(e);
  });
}

M.get('timelines/home', (error, data) => {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log(`Message count: ${data.length}`);
});

const params = {
  visibility: "direct",
  status: `The date is: ${new Date()}`
}

M.post('statuses', params, (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  }
});

function toot(content, id, media) {
  var params = {
    status: content,
    visibility: 'direct'
  }
  if (id) {
    params.in_reply_to_id = id;
  }
  if (media) {
    params.media_ids = [media];
  }
  M.post('statuses', params, (error, data) => {
    if (error) {
      console.error(error);
    } else {
      console.log(data);
      fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    }
  });
}



function favorite(id) {
  M.post(`statuses/${id}/favourite`);
}

ws.on('connection', function open() {
  console.log('connected');
});

ws.on('open', function open() {
  console.log('open');
});

ws.on('close', function close() {
  console.log('disconnected');
});

function clean(html) {
  var clean = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: []
  });
  return clean.replace("@bot", "").trim();
}

async function openweathermapSAVE(city) {
  var city = encodeURIComponent(city);
  var url = `http://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&APPID=${process.env.OPENWEATHERMAP_API_KEY}`;
  console.log(url);
  http(url, function(error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
    var weatherResponse = JSON.parse(body);
    if (weatherResponse.cod != '200') {
      var msg = `Weather lookup failed with error message: ${weatherResponse.message}`;
      console.log(msg);
      return msg;
    }
    fs.writeFileSync(`weather_${moment().format("YYY_MM_DD_HH_mm_ss")}.json`, JSON.stringify(weatherResponse, null, 2));
    var f = fahrenheit(weatherResponse.main.temp);
    var sunrise = new Date(weatherResponse.sys.sunrise * 1000);
    var sunset = new Date(weatherResponse.sys.sunset * 1000);
    var date = new Date(weatherResponse.dt * 1000);
    var msg = `Weather for ${weatherResponse.name}\nTemperature: ${weatherResponse.main.temp}°C ${f}°F\nConditions: ${weatherResponse.weather[0].main}\nSunrise: ${sunrise.toUTCString()}\nSunset: ${sunset.toUTCString()}\nDate: ${date}`;
    console.log(msg);
    return msg;
    //  process.exit(1);
  });
  var msg = "Return outside of http";
  console.log(msg);
  return msg;
}

function openweathermap(id, city) {
  var city = encodeURIComponent(city);
  var url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&APPID=${process.env.OPENWEATHERMAP_API_KEY}`;
  console.log(url);
  httpGet(id, url, city);
}

function fahrenheit(celsius) {
  return ((celsius * 9 / 5) + 32).toFixed(2);
}

async function weatherWithRadarSAVE(payload) {
  var fileName = `radar_${moment().format("YYY_MM_DD_HH_mm_ss")}.png`;
  options = {
    url: 'https://radar.weather.gov/Conus/Loop/southeast_loop.gif',
    dest: fileName,
    headers: {
      'User-Agent': 'Wget/1.11.4'
    }
  }
  await download.image(options).then(({
      filename,
      image
    }) => {
      console.log('File saved to', filename)
    })
    .catch((err) => {
      console.error(err)
    })
  const stream = fs.createReadStream(fileName);
  const params1 = {
    file: stream,
    description: 'Southeast radar animated GIF'
  };
  const response2 = await M.post("media", params1);
  console.log(`Media response: ${response2}`);
  const mediaId = response2.data.id;

  toot('Here is the SE radar', payload.id, mediaId);

}
ws.on('message', function incoming(data) {
  if (!data || data.length == 0) {
    console.log("No data in message.");
    return;
  }
  var obj = JSON.parse(data);
  var payload = JSON.parse(obj.payload)
  fs.writeFileSync(`data_${moment().format("YYY_MM_DD_HH_mm_ss")}.json`, JSON.stringify(payload, null, 2));
  console.log(`Stream data received ${JSON.stringify(payload)}`);
  if (payload.account.acct === "bot") {
    console.log("Don't talk to myself.");
    return;
  }
  if (payload.content) {
    favorite(payload.id);
    var said = clean(payload.content);
    console.log(`BEFORE: ${payload.content} AFTER: ${said}`);
    if (said.startsWith('weather')) {
      var content = said.substring('weather'.length).trim();
      openweathermap(payload.id, content);
    } else {
      toot(`You said "${said} "`, payload.id);
    }
  }

});
