# bot
Fediverse bot

I am running Pleroma. Here are some notes on getting started.

Register user bot on my server:

pleroma@pla-social:~/pleroma$ MIX_ENV=prod mix register_user bot bot MY_EMAIL_ADDRESS@gmail.com bot SOME_PASSWORD_HERE


Since Pleroma doesn't have the developer setting on the UI to get the client key, client secret, and access token I used:
https://tinysubversions.com/notes/mastodon-bot/index.html

Store secrets in .env and access them with dotenv nodejs package. 
