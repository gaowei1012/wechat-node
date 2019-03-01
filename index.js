const express = require('express');
const config = require('./config');
const WeChat = require('./wechat/wechat');
const app = express();

let wechatApp = new WeChat(config);

app.get('/', (req, res) => {
	wechatApp.auth(req, res);
	
});

// 请求获取 accesss_token
app.get('/getAccessToken', (req, res) => {
	wechatApp.getAccessToken().then((data) => {
		res.end(data)
	})
});

app.listen(config.port, () => {
	console.log(`wwechat serer started port ${config.port}`)
});