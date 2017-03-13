var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
//var http = require('http').Server(app);
var io = require('socket.io')(http);
var webshot = require("webshot");


//Initialise the application
var app = express();
var mongoose = require('mongoose'); //Place this on top
var bodyParser = require('body-parser');
var url = require('url');
var http = require('http');
//.Server(app);
fs = require('fs');

//**************DATABASE
app.use(bodyParser.urlencoded({
    extended: true
}));

/*Database connection - MongoDB*/
//Created from the command earlier. Ensure this is done on the first_db instance
var dbHost = 'localhost';

var database = 'logintutorial';

var url = 'mongodb://' + dbHost + '/' + database;
console.log('mongodb connection = ' + url);

mongoose.connect(url, function(err) {
    if(err) {
        console.log('connection error: ', err);
    } else {
        console.log('connection successful');
    }
});
//User Schema
var UserSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  name: String,
  username: String,
  email: String,
  password: String
});

var User = mongoose.model('user', UserSchema);

var bcrypt = require('bcrypt-nodejs');



//**************

//**************SETUP HANDLEBARS&CSS
//Setup viewengine
app.set('views', path.join( __dirname, 'views')); //Telling system views folder will handle views
app.engine('handlebars', exphbs({defaultLayout: 'layout'})); //Handlebars - layout file will be called
app.set('view engine', 'handlebars');

//BodyParser Middleware -- configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//set Public folder -stylesheets, images, jQuery
app.use(express.static(path.join(__dirname, 'public')));



//*****************
//***********SETTIPNG UP flash


//Express session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

//Passport Initialise
app.use(passport.initialize());
app.use(passport.session());

//Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.'),
      root          = namespace.shift(),
      formParam     = root;
    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//connect Flash Middleware
app.use(flash());

//Global Variables for flash
app.use(function (req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});


//***************


//var io = require('socket.io');
/*var io = require('socket.io').listen(server);
var app = express();
var server = require('http').createServer(app);
var users = [];
var connections = [];
*/
    //var path = url.parse(request.url).pathname;

    /*app.use(function(req, res, next){ //This must be set before app.router
   req.server = server;
   next();
});

*/
//*****GETTERS


app.get('/', function(req, res){
  res.render(__dirname + '/views/index');
});

app.get('/login', function(req, res){
  res.render(__dirname + '/views/login');
});
app.get('/postlogin', /*ensureAuthenticated,*/ function(req, res){
  res.render(__dirname + '/views/postlogin');
});
app.get('/studentHome', function(req, res){
  res.render(__dirname + '/views/studentHome');
});

app.get('/lecturerHome', function(req, res){
  res.render(__dirname + '/views/generateCode');
});
app.get('/buzz', function(req, res){
  res.render(__dirname + '/views/buzz');
});
/*app.get('/generateCode', function(req, res){
  res.render(__dirname + '/views/generateCode');
});*/
app.get('/logout',function(req,res){
    req.session.destroy(function(err){
        if(err){
            console.log(err);
        }
        else
        {
            res.redirect('/login');
        }
    });

});

//******
//*******REGISTER & login
passport.use(new LocalStrategy(
    function(username, password, done) {
      getUserByUsername(username, function(err, user){
        console.log('here');
        if(err) throw err;
        if(!user){
          console.log(username);
          return done(null, false, {message: 'Unknown user'});

        }
        comparePassword(password, user.password, function(err, isMatch){
          if(err) throw err;
          if(isMatch){
            return done(null, user);
          } else {
            return done(null, false, {message: "Invalid password"});
          }
        });
      });
  }));

  passport.serializeUser(function(user, done){
    done(null, user);
  });

  passport.deserializeUser(function(id, done){
    getUserById(id, function(err, user){
      done(null, user);
    });
  });

  app.post('/login',
  passport.authenticate('local', {successRedirect:'/postlogin', failureRedirect:'/login',failureFlash: true}), function(req, res) {
      res.redirect('/login');

  });
app.get('/register', function(req, res) {
  res.render(__dirname + '/views/register');
});

app.post('/register', function(req, res) {
  var name = req.body.name;
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  //var password2 = req.body.password2;


  req.checkBody('name', "Name is required").notEmpty();
  req.checkBody('username', "Username is required").notEmpty();
  req.checkBody('email', "email is required").notEmpty();
  //req.checkBody('email', "email is not valid").isEmail();
  req.checkBody('password', "password is required").notEmpty();
  //req.checkBody('password2', 'passwords do not match').equals(req.password);
  var errors = req.validationErrors();

  if(errors){
    res.render("register", {
      errors:errors
    });
  } else {
    var newUser = new User({
      name: name,
      username: username,
      email: email,
      password: password
  });
};




//Functions
  var password = bcrypt.hashSync(req.body.password);
  req.body.password = password;
  User.create(req.body, function(err, saved){
    if(err){
      console.log(err);
      res.json({message : err});
    } else {
      req.flash('success_msg', 'You are now registered');

      res.render(__dirname + '/views/login');
    }
  });
});


getUserByUsername = function(username, callback){
  var query = {username : username};
  User.findOne(query, callback);
}

getUserById = function(id, callback){
  User.findById(id, callback);
}
comparePassword = function(candidatePassword, hash, callback){
  bcrypt.compare(candidatePassword, hash, function(err, isMatch){
    if(err) throw err;
    callback(null, isMatch);
  });
}

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next;
  } else {
    req.flash('error_msg', "You are not logged in");
    res.redirect('/login');
  }
}
//********
server = http.createServer(app);
server.listen(1337);

app.use(express.static(__dirname + '/public'));
var io = require('socket.io').listen(server);
var iol = io.listen(server);
var clients = [ ] ;
var socketsOfClients = {};
var codelecture;
//console.log(clients.length);
io.on('connection', function (socket) {
//client added here..
console.info('New client connected (id=' + socket.id + ').');
clients.push(socket.id);
console.log(clients.length);

  socket.on('message_to_server', function (data) {
      //iol.clients[socketIdOne].send()
          // we have a reference to socket from the closure above ^
           socket.broadcast.to(clients[0]).emit("message_to_client" , { message: data["message"] });
           //socket.broadcast.emit("message_to_client" , { message: socket.id + " says " + data["message"] });

         });
         socket.on('code',function(data){
           console.log("SERVER LECT CODE ");
          codelecture = data["message"];
           console.log(codelecture);
           printGlobal();
         });

//REF:: http://stackoverflow.com/questions/18365771/socket-io-cant-change-a-global-variable-in-socket-on

         function printGlobal(){
          // console.log("FUNC :"+ codelecture);
           return codelecture;
         }
           //console.log(codelecture);


         socket.on('codeStu', function(data) {
           console.log("STUDENT CODE SERVER ");
           codelecture = printGlobal();
           studentcode = data["message"];
          console.log("STU lec: "+ codelecture);
          console.log("STU stu: "+ studentcode);
           if(studentcode !== codelecture){
             console.log("WRONG");
             socket.emit('wrongcode', {});

           }
           else{
            socket.emit('rightcode',[]);

           }
         });

//reference https://github.com/brenden/node-webshot

         socket.on('webshot', function(){
           var renderStream = webshot('http://www.computing.dcu.ie/~ray/teaching/CA226/01-intro.html#(1)');
           var file = fs.createWriteStream('/CA226/01-intro.html.png', {encoding: 'binary'});
          console.log("screenshot");
           renderStream.on('data', function(data) {
             file.write(data.toString('binary'), 'binary');
           });
         })

      socket.on('disconnect', function() {
             console.log('Got disconnect!');
              var index = clients.indexOf(socket);
              clients.pop(clients.id);
              console.log(clients.length);

              if (index != -1) {
                  clients.splice(index, 1);
                  console.info('Client gone (id=' + socket.id + ').');
                  console.log(clients.length);
              }
          });
   });
