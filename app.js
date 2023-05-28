//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

const userSchema  = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(encrypt ,{secret : process.env.SECRET , encryptFields: ["password"]});

const User = new mongoose.model("User", userSchema);

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser : true});
app.get("/",function(req,res){
  res.render("home");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
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
        if (foundUser.password === password) {
          res.render("secrets");
        } else {
          console.log("Incorrect password");
        }
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
