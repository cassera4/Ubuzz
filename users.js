var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/users');
var io = require('socket.io');
//ensure user is logged in
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next;
  } else {
    req.flash('error_msg', "You are not logged in");
    res.redirect('/users/login');
  }
}

//Register
router.get('/register', function(req, res) {
  res.render('register');
});


router.get('/postlogin', function(req, res){
  res.render('postlogin');
});
//Login
router.get('/login', function(req, res) {
  res.render('login');
});


router.get('/studentHome', /*ensureAuthenticated,*/ function(req, res, next){
  //next();
  res.render('studentHome');
});

router.get('/lecturerHome', /*ensureAuthenticated,*/ function(req, res){
  res.render('lecturerHome');
});

router.get('/access', function(req, res){
  res.render('access');
});

router.get('/buzz', function( req, res, next) {
  res.render('buzz' );
  console.log('Im here');
  /*res.io.on('connection', function(socket) {
    console.log('user connected');
  });*/
});


router.get('/generateCode', function(req, res){
  res.render('generateCode');
});



//Register user
router.post('/register', function(req, res) {
  var name = req.body.name;
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var password2 = req.body.password2;


  //Validation
  req.checkBody('name', "Name is required").notEmpty();
  req.checkBody('username', "Username is required").notEmpty();
  req.checkBody('email', "email is required").notEmpty();
  req.checkBody('email', "email is not valid").isEmail();
  req.checkBody('password', "password is required").notEmpty();
  req.checkBody('password2', 'passwords do not match').equals(req.body.password);

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
    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);

    });

    req.flash('success_msg', 'You are now registered');

    res.redirect('/users/login');
  }

});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown user'});

      }
      User.comparePassword(password, user.password, function(err, isMatch){
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
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user){
    done(err, user);
  });
});

//If login is successfull -> Student otherwise stay on login
//Cant get redirect here
router.post('/login',
passport.authenticate('local', {successRedirect:'/users/postlogin', failureRedirect:'/users/login',failureFlash: true}), function(req, res) {
    res.redirect('/login');

});

router.get('/logout',function(req, res){
  req.logout();

  req.flash('success_msg', "You are logged out");

  res.redirect('/users/login');
});




module.exports = router;
