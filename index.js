require('dotenv').config();
const Mastodon = require('mastodon-api');
const fs = require('fs');


console.log("Bot starting...")



const M = new Mastodon({
  access_token: process.env.ACCESS_TOKEN,
  client_secret: process.env.CLIENT_SECRET,
  client_key: process.env.CLIENT_KEY,
  timeout_ms: 60 * 1000,
  api_url: 'https://pla.social/api/v1/'
});



M.get('timelines/home', (error, data) => {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log(`Message count: ${data.length}`);
});

const params = {
  visibility: "unlisted",
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


const listener = M.stream('streaming?stream=public:local')

listener.on('message', msg => console.log(msg))

listener.on('error', err => console.log(err))
