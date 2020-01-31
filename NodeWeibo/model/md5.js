const crypto = require('crypto');
/*加密方法封装成为一个函数*/
module.exports = function (mingma) {
    const md5 = crypto.createHash('md5');
    const password = md5.update(mingma).digest('base64');
    return password;
};