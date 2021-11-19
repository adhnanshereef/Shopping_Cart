var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var userRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var hbs=require('express-handlebars')
var fileUpload=require('express-fileupload');
var db=require('./config/connection')
var session=require('express-session');
const userHelpers=require('./helpers/user-helpers')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:"hbs",defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+"/views/partials/"}));
app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"Key",cookie:{maxAge:600000}}))
db.connect((err)=>{
  if(err)
    console.log("Connection err "+err);
    else
    console.log('Connected');
})
app.use(express.static('public/product-images'));
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(async(err, req, res, next)=>{
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  let cartCount=null
  if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  res.render('error',{user:req.session.user,cartCount});
});

module.exports = app;
