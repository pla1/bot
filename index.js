const Mastodon = require('mastodon-api')
require('dotenv').config()

console.log("Bot starting...")

const M = new Mastodon({
  access_token: process.env.ACCESS_TOKEN,
  client_secret: process.env.CLIENT_SECRET,
  client_key: process.env.CLIENT_KEY,
  timeout_ms: 60 * 1000,
  api_url: 'https://pla.social/api/v1/'
});

const params = {
  visibility: "unlisted",
  status: "Hello"
}

M.post('statuses', params, (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
});
