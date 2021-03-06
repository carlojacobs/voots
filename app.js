// Dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt')
var hbs = require('express-handlebars')

// Keep in mind the order of these
var groups = require('./routes/groups');
var users = require('./routes/users');
var voots = require('./routes/voots');
var index = require('./routes/index');

// Express app
var app = express();

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutDir: __dirname + '/views/layouts'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('json spaces', 2);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Express jsonwebtoken middleware
app.use(expressJwt({ secret: 'myawesomejwtsecret' }).unless({ path: ['/users/login', '/users/register', '/'] }));

// Routes
app.use('/', index);
app.use('/users', users);
app.use('/voots', voots);
app.use('/groups', groups);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
