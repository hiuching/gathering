﻿var express = require('express');
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
console.log('Server running at http://127.0.0.1:8004/');

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
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var controllers = {};
var modules = [
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

app.put('/gathering/:moduleName', function (req, res) {
  var moduleName = req.params.moduleName;
        getController(moduleName, function(error, controller){
                return controller.update(req, res);
        });
});

app.post('/gathering/:moduleName', function (req, res) {
  var moduleName = req.params.moduleName;
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


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// app.listen(8004, '192.168.100.104');
// app.listen(8004, localhost);

var getController = function (moduleName, callback){
	console.log (controllers[moduleName]);
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
                app.listen(8004, entry.address);
                console.log('connecting to ' + entry.address);
      }
    });
}