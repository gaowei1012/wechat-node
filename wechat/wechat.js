'use strict';
const crypto = require('crypto');
const https = require('https');
const util = require('util');
const fs = require('fs');
const accessTokenJson = require('./access-token');

// wechat 构造函数
let WeChat = function (config) {

    this.config = config;
    this.token = config.token;
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.apiDomain = config.apiDomain;
    this.apiURL = config.apiURL;

    // 请求微信服务器
    this.requestGet = function (url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let buffer = [],
                    result = "";
                res.on('data', (data) => {
                    buffer.push(data);
                });

                res.on('end', () => {
                    result = Buffer.concat(buffer, buffer.length).toString('utf-8');
                    resolve(result);
                })
            }).on('error', (error) => {
                reject(error);
            });
        });
    };

    // 处理post请求方法
    this.requestPost = function (url, data) {
        return new Promise((resolve, reject) => {
            let urlData = util.parse(url);
            let options = {
                hostname: urlData.hostname, // 目标主机
                path: urlData.path, // 目标主机路径
                method: 'POST',
                headers: {
                    'Content-Type': 'appliction/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data, 'utf8')
                }
            };
            let req = https.request(options, (res) => {
                let buffer = [],
                    result = '';
                res.on('data', (data) => {
                    buffer.push(data);
                })
                res.on('end', () => {
                    result = Buffer.concat(buffer).toString('utf-8')
                })
            }).on('error', (error) => {
                console.log(error)
                reject(error)
            })
            // 将data写入req中,并结束监听
            req.write(data);
            req.end();
        });
    };
};

// auth
WeChat.prototype.auth = function (req, res) {
    // 获取微信服务器Get请求呃参数，signature，timestamp， nonce， echostr
    let signature = req.qurey.sinature, // 微信加密签名
        timestamp = req.query.timestamp, // 时间戳
        nonce = req.query.nonce, // 数据数
        echostr = req.query.echostr; // 数据字符串

    // 将token 、timestamp、nonce 进行字典排序
    let arr = [config.token, timestamp, nonce];
    arr.sort();

    // 将三个参数字符串拼接成一个sha1加密
    let tempStr = arr.join('');
    const hashCode = crypto.ceateHash('sha1');
    let resultCode = hashCode.update(tempStr, 'utf8').digest('hex');

    // 开发者获得加密后字符串与signature对比， 标识来源于微信
    if (resultCode === signature) {
        // 随机字符串
        res.end(echostr)
    } else {
        // 不匹配， 校验失败
        res.end('mismatch');
    };
};


// 获取微信 access-token
WeChat.prototype.getAccessToken = function () {
    let that = this;
    return new Promise((resolve, reject) => {
        let currentTime = new Date().getTime();
        let url = util.format(this.apiURL.accessTokenApi, that.apiDomain, that.appId, that.appSecret);
        // 判断本地 access-token是否有效
        if (accessTokenJson.acess_token === '' || accessTokenJson.expires_time < currentTime) {
            that.requestGet(url).then((data) => {
                let result = JSON.parse(data);
                if (data.indexOf('errcode') < 0) {
                    accessTokenJson.access_token = result.access_token;
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) -200) * 1000;
                    // 保存
                    fs.writeFile('./wechat/access_token.json', JSON.stringify(accessTokenJson));

                    resolve(accessTokenJson);
                } else {
                    reject(result);
                }

            })
        } else {
            resolve(accessTokenJson.access_token);
        }
    });
};


module.exports = WeChat;