const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const hbs = require('hbs')
const index = require('./routes/index')
const api = require('./routes/api')
//const hbsService = require('./services/hbsService')
const passport   = require('passport')
const session    = require('express-session')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const env = require('dotenv').load();
const exphbs = require('express-handlebars')
const flash = require('express-flash');

const app = express()

/*
|--------------------------------------------------------------------------
| App configuration
|--------------------------------------------------------------------------
*/
app.set('views', './app/views')
app.engine('hbs', exphbs({extname: '.hbs',
    helpers: require("./services/handlebars.js").helpers,
    defaultLayout: 'layout',
    layoutsDir: path.join(__dirname, 'app/views'),
    partialsDir  : [
        //  path to your partials
        path.join(__dirname, 'app/views/partials'),
    ]}));
app.set('view engine', 'hbs');
app.locals.app_name = 'Geartrack'
//hbsService(hbs) // Register hbs partials and helpers

/*
|--------------------------------------------------------------------------
| App middlewares
|--------------------------------------------------------------------------
*/
app.use(logger('dev'))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(express.static(path.join(__dirname, 'public')))

/*
|--------------------------------------------------------------------------
| App Login / Mysql
|--------------------------------------------------------------------------
*/

//For BodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// For Passport
 
app.use(session({ secret: 'SledzenieP',resave: true, saveUninitialized:true,cookie: { maxAge: 24 * 60 * 60 * 1000 }})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

//Models
var models = require("./app/models");

//load passport strategies
 
require('./app/config/passport/passport.js')(passport, models.user);
 
//Sync Database
models.sequelize.sync().then(function() {
 
    console.log('Nice! Database looks fine')
 
}).catch(function(err) {
 
    console.log(err, "Something went wrong with the Database Update!")
 
});

/*
|--------------------------------------------------------------------------
| App Routes
|--------------------------------------------------------------------------
*/
app.use('/', index)
app.use('/api', api)
//Routes
var authRoute = require('./routes/auth.js')(app,passport);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/
app.use(function(req, res, next) {
    const err = new Error('Not Found')
    err.status = 404
    res.type('html')
    res.status(404).render('404', {title: "404"})
})

/*
|--------------------------------------------------------------------------
| Error handle
|--------------------------------------------------------------------------
*/
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
