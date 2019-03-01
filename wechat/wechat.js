'use strict';
const crypto = require('crypto');
const https = require('https');
const util = require('util');
const fs = require('fs');
const parseString = require('xml2js');
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
    let signature = req.qurey.signature, // 微信加密签名
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
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
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


// 处理温馨消息
WeChat.prototype.handMsg = function (req, res) {
    let buffer = [];

    req.on('data', (data) => {
        buffer.push(data);
    });

    req.on('end', () => {
        let msgXml = Buffer.concat(buffer).toString('utf-8');
        parseString(msgXml, { explicitArray: false }, (err, result) => {
            if (!err) {
                result = result.xml;
                let toUser = result.ToUserName; // 接收微信
                let fromUser = result.FromUserName; // 发送微信

                // 消息类型
                if (result.MsgType.toLowerCase() === 'event') {
                    // 返回消息
                    switch (result.Event.toLowerCase()) {
                        case 'subscribe':
                            let conetnt = "欢迎关注执念的微信公众号";
                            conetnt += "1.你是谁\n";
                            conetnt += "2.业务介绍\n";
                            conetnt += "3.回复留言\n";
                            conetnt += "4.微信小程序定制开发\n";
                            conetnt += "5.网站定制开发\n";
                            conetnt += "因为专注，所以专业";
                            res.end(msg.txtMsg(fromUser, toUser), conetnt);
                            break;
                        case 'click':
                            let contentArr = [
                                { Title: "Node.js 微信自定义菜单", Description: "使用Node.js实现自定义微信菜单", PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72868520" },
                                { Title: "Node.js access_token的获取、存储及更新", Description: "Node.js access_token的获取、存储及更新", PicUrl: "http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72783631" },
                                { Title: "Node.js 接入微信公众平台开发", Description: "Node.js 接入微信公众平台开发", PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72765279" }
                            ];
                            reportMsg = msg.graphicMsg(fromUser, toUser, contentArr);
                            break;
                    };
                } else {
                    // 文本
                    if (result.MsgType.toLowerCase() === 'text') {
                        switch (result.Conetnt) {
                            case 1:
                                res.send(msg.txtMsg(fromUser, toUser, 'Hello \r\n'));
                                break;
                            case 2:
                                res.send(msg.txtMsg(fromUser, toUser, '业务开通中 \r\n'));
                                break;
                            case 3:
                                res.send(msg.txtMsg(fromUser, toUser, '回复留言,我会看到的哦😯!!!'))
                                break;
                            default:
                                res.send(msg.txtMsg(fromUser, toUser, '没有这个选项喲!~'));
                                break;
                        }
                    }
                }

            } else {
                console.log(err);
            }
        });
    })
};

module.exports = WeChat;