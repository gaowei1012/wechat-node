const express = require('express');
const config = require('./config');
const WeChat = require('./wechat/wechat');
const app = express();

let wechatApp = new WeChat(config);

app.get('/', (req, res) => {
	wechatApp.auth(req, res);
});

// 处理消息
app.post('/', (req, res) => {
	let buffer = [];

	// data
	req.on('data', (data) => {
		buffer.push(data)
	});

	// end 
	req.on('end', () => {
		console.log(Buffer.concat(buffer).toString('utf-8'))
	});
});

// 请求获取 accesss_token
app.get('/getAccessToken', (req, res) => {
	wechatApp.getAccessToken().then((data) => {
		res.end(data)
	})
});

app.listen(config.port, () => {
	console.log(`wechat server started port:${config.port}`)
});