/*班级说说的函数入口*/
const express = require('express');
const app = express();
const router = require('./router/router.js');
const session = require('express-session');

//使用session
app.use(session({
    secret: 'keyboard cat',
    resave:false,
    saveUninitialized: true,
}));

//设置模板引擎
app.set('view engine','ejs');
// 配置模板页面的存放路径
//app.set('views', './views')
/*一般默认配置的模板ejs在views文件夹中，也可以自己去设置*/

//静态页面出来
app.use(express.static('./public'));
//静态图片地址
app.use("/avatar",express.static("./avatar"));

//路由表
app.get('/',router.showIndex);

//注册业务
app.get('/regist',router.showRegist);
//处理注册
app.post('/doregist',router.doRegist);

//登陆业务
app.get('/login',router.showLogin);
//处理登陆
app.post('/dologin',router.doLogin);

//设置头像
app.get('/setavatar',router.showSetavatar);
//处理头像
app.post('/dosetavatar',router.doSetavatar);
//裁剪头像
app.get('/cut',router.showCut);
//执行剪裁头像
app.get('/docut',router.doCut);

//发表说说
app.post('/post',router.doPost);

//说说列表//从Ajax服务列出所有说说
app.get('/getAllShuoShuo',router.getAllShuoShuo);
//得到用户信息
app.get('/getuserinfo',router.getuserinfo);
//得到说说总数量
app.get('/getshuoshuoamount',router.getshuoshuoamount);

//显示所有用户的说说
app.get('/user/:user',router.showUser);
//成员列表
app.get('/userlist',router.showUserList);
//说说详情
//app.get('/post/:oid',router.showUser);

app.listen(3000,'127.0.0.1');