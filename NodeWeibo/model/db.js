/*测试连接mongodb数据库*/
const db = require('mongodb');
const settings = require('./set');

//根据配置文件获取连接的数据库地址
const url = settings.dburl;
//获取数据库名字
const dbname = settings.dbname;

//创建连接
/*要在 MongoDB 中创建一个数据库，首先我们需要创建一个 MongoClient 对象，然后配置好指定的 URL 和 端口号。
如果数据库不存在，MongoDB 将创建数据库并建立连接。*/
const Connect = require('mongodb').MongoClient;

//将连接数据库的函数封装成为一个方法，方便后期的调用
/*callback只是一个普通的函数，叫回调是因为它一般是在传入的函数运行结束时被调用
* */
function lianjie(callback){
    Connect.connect(url,{useNewUrlParser:true,useUnifiedTopology: true },function (err,db) {
        if(err){
            /*如果错误，直接抛出去*/
            throw err;
        }
        //如果正常，就可以等这个函数运行结束后，再去调用了！
        /*这句话意思就是，传入的函数已经运行结束了，然后就可以去进行调用了
       * 这就是回调函数*/
        callback(err,db);
    });
}

//这里调用函数即可
lianjie(function (err,db) {
    //表示连接成功之后做的事情
});

init();
//对数据库创建索引
function init(){
    lianjie(function (err,db) {
        if(err){
            throw err;
            return;
        }
        let mydb = db.db(dbname);

        mydb.collection(settings.users).createIndex(
            {
                /*设置索引类型*/
                'username':1
            },
            null,
            function (err,result) {
                    if(err){
                        throw err;
                    }
                    //console.log('索引建立成功');
                db.close();
        });
    });
}


//创建插入操作
//name 集合名字
exports.add = function (name,json,callback) {
    //这个是添加的函数，到时候传入json键值对即可使用该函数
    /*我在这里固定了传递的集合表*/
    lianjie(function (err,db) {
        //先将数据库进行连接，再去进行操作

        //mongodb2.0的方法会报TypeError: db.collection is not a function错误
        //所以需要如下方法进行改进
        //获取数据库的name
        let mydb = db.db(dbname);

        mydb.collection(name).insertOne(json,function (err,result) {
            if(err){
                //如果插入失败直接将错误抛出去
                //console.log('插入失败！！');
                throw err;
            }
            callback(err,result);
            db.close();
        });
    });
};

//创建删除操作
/*传入查询条件即可*/
exports.delete = function (name,json,callback) {
    lianjie(function (err,db) {
        let mydb = db.db(dbname);

        mydb.collection(name).deleteMany(
             json,
            function (err,result) {
                if(err){
                    throw err;
                }
                callback(err,result);
                //console.log('删除成功。。？');
                db.close();
        });

    });
};

//创建修改操作
exports.update = function (name,json1,json2,callback) {
    lianjie(function (err,db) {
        let mydb = db.db(dbname);
        mydb.collection(name).updateMany(json1,json2,function (err,result) {
            if(err){
                throw err;
            }
            callback(err,result);
            db.close();
        })
    })
};

//查询数据操作
exports.find = function (name,json,callback) {
    lianjie(function (err,db) {
        let mydb = db.db(dbname);
        mydb.collection(name).find(json).toArray(function (err,result) {
            if(err){
                throw err;
            }
            callback(err,result);
            db.close();
        })
    })

};
//查询数据并且排序的操作
exports.find2 = function (name,json,C,callback) {
    const result = [];    //结果数组
    //应该省略的条数
    const skipnumber = C.pageamount * C.page || 0;
    //数目限制
    const limit = C.pageamount || 0;
    //排序方式
    const sort = C.sort || {};

    lianjie(function (err,db) {
        let mydb = db.db(dbname);
        const cursor = mydb.collection(name).find(json).skip(skipnumber).limit(limit).sort(sort);

        cursor.each(function (err, doc) {
            if (err) {
                callback(err, null);
                db.close(); //关闭数据库
                return;
            }
            if (doc != null) {
                result.push(doc);   //放入结果数组
            } else {
                //遍历结束，没有更多的文档了
                callback(null, result);
                db.close(); //关闭数据库
            }
        });
    })
};

//得到总数量
exports.getAllCount = function (collectionName,callback) {
    lianjie(function (err, db) {
        let mydb = db.db(dbname);
        mydb.collection(collectionName).countDocuments({}).then(function(count) {
            callback(count);
            db.close();
        });
    })
};