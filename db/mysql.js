var mysql = require('mysql')

var db={
	connect:function(){
	
	/* 
		var conn = mysql.createConnection({
		    host: 'localhost',
		    user: 'root',
		    password: 'root',
		    database:'test',
		    port: 3306
		});*/
		var conn = mysql.createConnection({
		    host: 'localhost',
		    user: 'root',
		    password: '',
		    database:'micro_weichi_development',
		    port: 3306
		});
		conn.connect();
		return conn;
	}
}

/*
conn.query('select * from users', function(err, rows, fields) {
    if (err) throw err;
    console.log(rows)
    console.log('The solution is: ', rows[0].name);
});
conn.end();
 */
module.exports = db;
