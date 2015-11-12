var db = require('../db/mysql'),
    sio = require('socket.io');
    // redis = require("redis"),
var redis = require("redis"),
    client_options = {
        parser: "hiredis"
};

var redis_client = redis.createClient(6379, 'localhost');

redis_client.on("error", function (err) {
      console.log("Error " + err);
});

var IO = function(server) {
	var io = sio.listen(server)
	var users = {},
	    usocket = {};
	var counter = 0;
	var home = {};
	var xss = require('xss');
	var drawlist = ['杯子', '苹果', '香蕉', '花',"乌龟","大象","飞机","手枪","蛋糕","火车","椅子","桌子","大树"];
	var quest = "";
	var interval = null;
	// 添加或更新白名单中的标签 标签名（小写） = ['允许的属性列表（小写）']
	xss.whiteList['img'] = ['src'];
	// 删除默认的白名单标签
	delete xss.whiteList['div'];
	// 自定义处理不在白名单中的标签
	xss.onIgnoreTag = function(tag, html) {
		// tag：当前标签名（小写），如：a
		// html：当前标签的HTML代码，如：<a href="ooxx">
		// 返回新的标签HTML代码，如果想使用默认的处理方式，不返回任何值即可
		// 比如将标签替换为[removed]：return '[removed]';
		// 以下为默认的处理代码：
		return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function Quest() {
		//随机出题
		outQuest();
		//interval = setInterval(outQuest, 60000);
	}

	function outQuest() {
		quest = drawlist[Math.floor(drawlist.length * Math.random())];
		console.log("quest:" + quest)
		home.socket.emit('quest', quest);
		sendmsg({
			type: 0,
			msg: "有个傻逼在画画，快来猜他画的是什么玩意儿。它可能会画( "+ drawlist.join(',')+")"
		});
		setTimeout(function() {
			homeLeave(home.name);
		}, 30000)
	}

	io.on('connection', function(socket) {
		console.log('a user connected.');
		var user_id = "";
		socket.broadcast.emit('hi', {})
		socket.on('disconnect', function() {
			console.log('user disconnected.');
		});
		socket.on('chat message', function(data) {
			var msg = data.msg;
			data.user_id = xss(user_id || data.user_id);
			users[user_id] = data.user_id;
			data.msg = xss(msg);
      data.uname = data.uname;
			data.time = +new Date();
			console.log(data)
			if (!data.match_id) {
				console.log('public')
				sendmsg(data);
			} else {
				data.type = 2; //悄悄话
				console.log("one")
				sendUserMsg(data);
			}
			insertData(data);
	  	//	if(data.msg == quest && username !==home.name){
	  	//		sendmsg({
	  	//			type: 0,
	  	//			msg: "恭喜"+username+"猜出题目。为他贺彩!!同时【"+home.name+"】画得也有模有样！"
	  	//		});
	  	//		homeLeave(home.name);
	  	//	}
		});
		socket.on('user join', function(data) {
			counter++;
			user_id = xss(data.user_id);
			users[user_id] = user_id;
			usocket[user_id] = socket;
			console.log('join:' + data.user_id);
			data.type = 0;
			data.users = users;
			data.counter = counter;
			data.msg = "欢迎<b>" + data.user + "</b>进入聊天室";
			sendmsg(data);
		});
		socket.on('disconnect', function() {
			console.log('disconnect')
			if (user_id) {
				counter--;
				delete users[user_id];
				delete usocket[user_id];
				if (home.name == user_id) {
					homeLeave(user_id);
				}
				sendmsg({
					type: 0,
					msg: "用户<b>" + user_id + "</b>离开聊天室",
					counter: counter,
					users: users
				})
			}
		});
		//绘画
		socket.on("draw", function(data) {
			if (data.user == home.name) {
				io.emit('draw', data);
			}
		})
		socket.on("home", function(data) {
			console.log('home:' + home.name)
			var user = data.user;
			if( !users[home.name] ){
				home = {};
			}
			if (!home.name) {
				home.name = user;
				home.socket = socket;
				usocket[user].emit('sys' + user, {
					user: user,
					msg: "当前房主(" + home.name + ");等他退出后，你就可以申请房主了."
				});
				Quest();
			} else {
				usocket[user].emit('sys' + user, {
					user: home.name,
					msg: "当前已经有房主(" + home.name + ");等他退出后，你就可以申请房主了."
				});
			}
			console.log('home:' + home.name)
		});
		socket.on('home leave', function(uname) {
			homeLeave(uname);
		})
	});

	function homeLeave(uname) {
		if (home.name && home.name == uname) {
			home = {};
			io.emit('home leave', uname);
		}
	}
	//插入数据库
	function insertData(data) {
		var conn = db.connect();
		var post = {
			msg: data.msg,
			uname: data.uname,
      user_id: data.user_id,
      match_id: data.match_id,
			time: data.time.toString(),
			to: data.to
		};
		var query = conn.query('insert into chatmsgs set ?', post, function(err, result) {
			console.log(err);
			console.log(result)
		})
		console.log(query.sql);
		conn.end();
	}

	function sendmsg(data) {
		io.emit('chat message', data);
	}

	function sendUserMsg(data) {
    var match_id = data.match_id;
    var user_ids = [];
    redis_client.smembers('MATCH_SET'+3, function (error, value) {
      console.info('redis client test 1');
      if (error) {
          console.info('ERROR: ' + error);
      }else {
          console.info(value);
          if (value) {
             user_ids = user_ids.concat(value);
          }
      } 
    });
    console.info(user_ids);
    redis_client.get('test', function (error, value) {
      console.info('redis client test 2');
      if (error)
          console.info('ERROR: ' + error);
      else
          console.info('Value: ' + value);
    });
		var conn = db.connect();
  	var query = conn.query('select * from matches  where id="'+match_id+'" LIMIT 1', function(err, result) {
    		console.log('err:' + err);
    		console.log(result)
        var match = result[0];
        user_ids.push(match.blackuser_id);
        user_ids.push(match.whiteuser_id);
        console.info("user ids");
        console.info(user_ids);
        for (var i=user_ids.length-1; i>=0; i--) {
          if (user_ids[i] in usocket) {
            console.log('================')
            console.log('to' + user_ids[i], data);
            usocket[user_ids[i]].emit('to' + user_ids[i], data);
            // usocket[data.user_id].emit('to' + data.user_id, data);
            console.log('================')
          }
        }
  	});
	}
	/*
	io.emit('some event', {
		for: "everyone"
	});
	*/
}
module.exports = IO;
