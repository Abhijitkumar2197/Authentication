//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findOrCreate");

const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our litlle secret.",
  resave: false,
  saveUninitialized: false
}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser : true});
// mongoose.set("useCreateIndex", true);

const userSchema  = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id, function(err,user){
    done(err,user);
  })
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
  res.render("home");
});


app.get("/auth/google", passport.authenticate("google", {scope: ['profile']}));

app.get("/auth/google/secret",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secret.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){
    res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }
});
app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
})
app.post("/register",function(req,res){
  bcrypt.hash(req.body.password , saltRounds ,function(err,hash){
    const newUser = new User({
      email: req.body.username,
      password: hash
    });
  })
  newUser.save()
    .then(() => {
      res.render("secrets");
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ email: username })
    .then(foundUser => {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password)
          .then(result => {
            if (result === true) {
              res.render("secrets");
            } else {
              console.log("Incorrect password");
            }
          })
          .catch(err => {
            console.log(err);
            res.status(500).send("Internal Server Error");
          });
      } else {
        console.log("User not found");
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send("Internal Server Error");
    });
});










app.listen(3000,function(){
  console.log("Server started on port 3000");
});
