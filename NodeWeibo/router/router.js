/*路由配置*/

/*引入所需插件*/
const formidable = require('formidable');
const db = require('../model/db.js');
const md5 = require('../model/md5.js');
const path = require('path');
const fs = require('fs');
const gm = require('gm');

//暴露首页
exports.showIndex = function (req,res,next) {
    //检索数据库，查找此人的头像
    let username = '';
    let login = '';
    let avatar = '';
    if (req.session.login == "1") {
        //如果登陆了
        username = req.session.username;
        login = true;
    } else {
        //没有登陆
        username = "";  //制定一个空用户名
        login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            avatar = "default.bmp";
        } else {
            avatar = result[0].avatar || 'default.bmp';
        }
        res.render("index", {
            "login": login,
            "username": username,
            "active": "首页",
            "avatar": avatar,    //登录人的头像
            //'shuoshuo':result,//获取说说内容

        });
        //方案一
        /*db.find2('posts',{},{'sort':{'datetime':-1}},function (err,result) {
            res.render("index", {
                "login": login,
                "username": username,
                "active": "首页",
                "avatar": avatar,    //登录人的头像
                //'shuoshuo':result,//获取说说内容
            });
        });*/
    });
};

//暴露注册页面
exports.showRegist = function (req,res,next) {
    res.render('regist',{
        /*session保存的用户名由这个传递*/
        'login':req.session.login == '1' ? true : false,
        'username':req.session.login == '1' ? req.session.username : '',
        'active':'注册'
    });
};
//处理注册业务
exports.doRegist = function (req,res,next) {
    const form = new formidable.IncomingForm();
    //formidable可以获取表单提交的数据
    form.parse(req,function (err,fields,files) {
        //得到用户填写的数据，并且查询数据，如果没有就加上这个人
        const username = fields.username;
        const password = fields.password;

        //找user表中的数据
        db.find(
            'users',
            {
                'username':username
            },
            function (err,result) {
                if(err){
                    res.send('-3');
                    return;
                }
                if(result.length!=0){
                    //已有该用户，不可注册
                    res.send('-1');
                    return;
                }

    /*******************************************************************/
                //设置加密密码(三层加密)
                let supermima = md5(md5(md5(password+'ph')+'ym'));
    /*******************************************************************/

                //用户名不存在就可以执行注册操作
                db.add(
                    'users',
                    {
                        'username':username,
                        'mima':password,
                        'password':supermima,
                        'avatar':'default.bmp'
                    },
                    function (err,result) {
                        if(err){
                            res.send('-3');
                            return;
                        }
                        //注册成功，写入session
                        req.session.login = '1';
                        req.session.username = username;

                        res.send('1');

                    });
        });
        //console.log(username,password);
    })
};

//暴露登陆页面
exports.showLogin = function (req,res,next) {
    res.render('login',{
        /*session保存的用户名由这个传递*/
        'login':req.session.login == '1' ? true : false,
        'username':req.session.login == '1' ? req.session.username : '',
        'active':'登陆'
    });
};
//处理登陆页面
exports.doLogin = function (req,res,next) {
    //res.render('login');
    //查询数据库，找人
    //得到用户表单
    const form = new formidable.IncomingForm();
    //formidable可以获取表单提交的数据
    form.parse(req,function (err,fields,files) {
        //得到用户填写的数据，并且查询数据，如果没有就加上这个人
        const username = fields.username;
        const password = fields.password;
        //解析加密密码(三层加密)
        let supermima = md5(md5(md5(password+'ph')+'ym'));
        //console.log(username,password);

        //查询数据库
        db.find(
            'users',
            {
                'username':username,
            },
            function (err,result) {
                if(err){
                    res.send('-5');
                    return;
                }
                if(result.length == 0){
                    //没有该用户
                    res.send('-1');
                    return;
                }
                if(supermima == result[0].password){
                    req.session.login = '1';
                    req.session.username = username;
                    res.send('1');//登陆成功
                    return;
                }else{
                    res.send('-2');//密码错误
                    return;
                }
            });

    });

};

//设置头像，需要保证是登陆状态
exports.showSetavatar = function (req,res,next) {
    if(req.session.login != '1'){
        res.end('非法闯入，页面要求登陆！！');
        return;
    }
    res.render('setavatar',{
        /*session保存的用户名由这个传递*/
        'login':true,
        'username':req.session.username || '刘鹏辉',
        'active':'修改头像',
    });
};
//处理头像
exports.doSetavatar = function (req,res,next) {
    if(req.session.login != '1'){
        res.end('非法闯入，页面要求登陆！！');
        return;
    }
    const form = new formidable.IncomingForm();
    //formidable可以获取表单提交的数据
    //设置上传的文件夹
    form.uploadDir = path.normalize(__dirname + '/../avatar');
    form.parse(req,function (err,fields,files) {
        //console.log(files);
        const oldpath = files.touxiang.path;
        const newpath = path.normalize(__dirname + '/../avatar')+'/'+req.session.username+'.jpg';
        fs.rename(oldpath,newpath,function (err) {
            if(err){
                res.send('失败');
                return;
            }
            req.session.avatar = req.session.username+'.jpg';
            //上传成功之后，跳转到切取业务
            res.redirect('/cut');
        })
    });
}
//裁剪头像
exports.showCut = function (req,res,next) {
    if(req.session.login != '1'){
        res.end('非法闯入，页面要求登陆！！');
        return;
    }
    res.render('cut',{
        avatar : req.session.avatar
    });
}
//执行切图
exports.doCut = function (req,res,next) {
    if(req.session.login != '1'){
        res.end('非法闯入，页面要求登陆！！');
        return;
    }

    //接收4个参数
    const filename = req.session.avatar;
    const w = req.query.w;
    const h = req.query.h;
    const x = req.query.x;
    const y = req.query.y;

    gm('./avatar/'+filename)
        .crop(w,h,x,y)
        .resize(100,100,'!')
        .write(
            './avatar/'+filename,
            function (err) {
                if(err){
                    res.send('-1');
                    return;
                }
                //更改数据库当前用户的头像
                db.update(
                    'users',
                    {
                        'username':req.session.username
                    },{
                        $set:{'avatar':req.session.avatar}
                    },function (err,result) {
                        if(err){
                            throw err;
                        }
                        res.send('1');
                    });
            });
}

//发表说说
exports.doPost = function (req,res,next) {
    //这个页面需要用户登陆
    if(req.session.login != '1'){
        res.end('非法闯入，页面要求登陆！！');
        return;
    }
    const form = new formidable.IncomingForm();

    //session中的用户名
    const username = req.session.username;

    //formidable可以获取表单提交的数据
    form.parse(req,function (err,fields,files) {
        //得到用户填写的数据，并且查询数据，如果没有就加上这个人
        const content = fields.content;
        db.add(
            'posts',
            {
                'username':username,
                'datetime':new Date(),
                'content':content
            },
            function (err,result) {
                if(err){
                    res.send('-3');
                    return;
                }
                //发表成功
                res.send('1');
            });
        });
};

//列出所有说说，提供列表
exports.getAllShuoShuo = function (req,res,next) {
    //页面接收一个参数，页面
    const page = req.query.page;
    db.find2('posts',
        {},
        {'pageamount':20,'page':page,'sort':{'datetime':-1}},function (err,result) {
           // const obj = {'r':result};
            res.json(result);
    })
};
//得到用户信息
exports.getuserinfo = function (req,res,next) {
    //页面接收一个参数，页面
    const username = req.query.username;
    db.find('users',
        {
            'username':username
        },
        function (err,result) {
                    const obj = {
                        'username':result[0].username,
                        'avatar':result[0].avatar,
                        '_id':result[0]._id,
                    }
                    res.json(obj);
    })
};

//得到说说总数量
exports.getshuoshuoamount = function (req,res,next) {
    db.getAllCount('posts',function (count) {
        res.send(count.toString());
    })
};

//显示用户说说
exports.showUser = function (req,res,next) {
    const user = req.params['user'];
    /*console.log(req.params);//{ user: 'lph' }*/

    //在数据库查找此人的说说
    db.find('posts',{'username':user},function (err,result) {
        //查询用户的头像
        db.find('users',{'username':user},function (err,result2) {
            //渲染user页面
            res.render('user',{
                'login':req.session.login == '1' ? true : false,
                'username':req.session.login == '1' ? req.session.username : '',
                'user':user,
                'active':'我的说说',
                'cirenshuoshuo':result,
                'cirentouxiang':result2[0].avatar
            });
        })
    });
};

//显示用户列表
exports.showUserList = function (req,res,next) {
    //查询用户的头像
    db.find('users',{},function (err,result) {
        //渲染user页面
        res.render('userlist',{
            'login':req.session.login == '1' ? true : false,
            'username':req.session.login == '1' ? req.session.username : '',
            'active':'成员列表',
            'suoyouchengyuan':result,
        });
    });
};
