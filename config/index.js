const config = {
	port: 7090,
	// wechat token
	token: "wechat",
	appId: "wx59d4028376922737",
	appSecret: "250a780e329c86694d598623da612ad4",
	apiDomain: "https://api.weixin.qq.com/",
	apiURL: {
		accessTokenApi: "%scgi-bin/token?grant_type=client_credential&appid=%s&secret=%s"
	},
	createMenu: "%scgi-bin/menu/create?access_token=%s"
}

module.exports = config;