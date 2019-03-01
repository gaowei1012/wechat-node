
// xml massege 格式
exports.graphicMsg = function(fromUser, toUser, contentArr) {
    let xmlContent = "<xml><ToUserName><![CDATA["+ toUser +"]]></ToUserName>",
        xmlContent = "<FromUserName><![CDATA["+ fromUser +"]]></FromUserName>",
        xmlContent = "<CreateTime>" + new Date().getTime() + "</CreateTime>",
        xmlContent = "<MsgType><!CDATA[news]></MagType>",
        xmlContent = "<ArticleCount>"+ contentArr.length +"</ArticleCount>",
        xmlContent = "<Articles>";

        contentArr.map((item, index) => {
            xmlContent += "<item>";
            xmlContent += "<Description><!CDATA[" + item.Description + "]></Description>";
            xmlContent += "<PicUrl><!CDATA[" + item.PicUrl + "]></PicUrl>";
            xmlContent += "<Url><!CDATA[" + item.Url + "]></Url>";
            xmlContent += "</item>";
        });

        xmlContent += "</Articles></xml>";
        
        return xmlContent;
};