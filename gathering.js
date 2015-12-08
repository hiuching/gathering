var express = require('express');
var logger = require('morgan');
var favicon = require('serve-favicon');
var path = require('path');
var os = require('os');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var ejs = require('ejs');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var app = express();

var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
});
console.log('Server running at http://127.0.0.1:8081/');

var options = {
	user: 'gathering',
	pass: '123456789'
}
mongoose.connect('mongodb://ds051933.mongolab.com:51933/gathering', options);
console.log('DB connected to mongodb://ds051933.mongolab.com:51933/gathering');

// set .html as the default extension 
app.set('views', path.join(__dirname, 'public')); 
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('title', 'Garthering');

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
// app.use(bodyParser.json({limit: CONFIG.fileLimit}));
// app.use(bodyParser.urlencoded({ extended: true, limit: CONFIG.fileLimit }));
app.use(bodyParser.json({limit: '30mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all("/gathering/*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  return next();
});

app.all("/login", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  return next();
});

var controllers = {};
var modules = [
'event',
'file',
'user'
];

var count = modules.length;
for (var ii=0; ii < count; ii++) {
	var controller = require('./controller/' + modules[ii] + 'Controller');
	controllers[modules[ii]] = new controller();
}
/**************************
route
**************************/


app.delete('/gathering/:moduleName/:id', function (req, res) {
	var moduleName = req.params.moduleName;
		getController(moduleName, function(error, controller){
						return controller.removeById(req, res);
		});
});

app.get('/gathering/:moduleName', function (req, res) {
	var moduleName = req.params.moduleName;
	getController(moduleName, function(error, controller){
		return controller.findAll(req, res);
	});
});


app.get('/gathering/:moduleName/:id', function (req, res) {
	var moduleName = req.params.moduleName;
		getController(moduleName, function(error, controller){
			return controller.findById(req, res);
		});
});

app.post('/gathering/:moduleName', function (req, res) {
	var moduleName = req.params.moduleName;
		console.log('moduleName', moduleName);
        getController(moduleName, function(error, controller){
            return controller.add(req, res);
        });
});

app.put('/gathering/:moduleName/:id', function (req, res) {
	var moduleName = req.params.moduleName;
	getController(moduleName, function(error, controller){
		return controller.updateById(req, res);
	});
});

app.get('/login', function (req, res) {
	var UserController = require('./controller/userController');
	var User = new UserController();
    return User.login(req, res);
});

app.all("/gathering/*", function(req, res, next) {
  if (req.method.toLowerCase() !== "options") {
    return next();
  }
  return res.send(204);
});

app.all("/login", function(req, res, next) {
  if (req.method.toLowerCase() !== "options") {
    return next();
  }
  return res.send(204);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// app.listen(8004, '192.168.100.104');
// app.listen(8004, localhost);

var getController = function (moduleName, callback){
    callback(null, controllers[moduleName])
 };

 
/**************************
error handlers
**************************/
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    console.log('env == development');
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
        // production error handler
        // no stacktraces leaked to user
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
}

var interfaces = os.networkInterfaces();
  for(name in interfaces) {
    var interface = interfaces[name];
    interface.forEach(function(entry) {
      if (entry.family === "IPv4")   {
                app.listen(8081, entry.address);
                console.log('connecting to ' + entry.address);
      }
    });
}