const AWS = require("aws-sdk");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const shortId = require("shortid");
const { registerEmailParams } = require("../helpers/email");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  //Check if user exists
  User.findOne({ email }).exec((err, user) => {
    //if user exists send error
    if (user) {
      return res.state(400).json({
        error: "Email exist",
      });
    }

    // If user not exist, then create a token for email activation
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: "10m",
      }
    );

    // Send Email
    const params = registerEmailParams(email, token);

    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("Email submitted to SES");
        res.json({
          message: `Email has been sent to ${email}, Follow the instructions to complete your registration`,
        });
      })
      .catch((error) => {
        console.log("SES Email on Register ", error);
        res.json({
          message: `We could not verify your email, please try again!`,
        });
      });
  });
};

exports.registerActivate = (req, res) => {
  const { token } = req.body;

  jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
    err,
    decoded
  ) {
    if (err) {
      return res.state(401).json({
        error: "Expired link, Try again",
      });
    }

    const { name, email, password } = jwt.decode(token);
    const username = shortId.generate();

    User.findOne({ email }).exec((err, user) => {
      if (user) {
        return res.status(401).json({
          error: "Email exists",
        });
      }

      //create new user
      const newUser = new User({ username, name, email, password });
      newUser.save((err, user) => {
        if (err) {
          return res.status(401).json({
            error: "Error saving user, try later",
          });
        }

        return res.json({
          message: "Registration Success, Please login",
        });
      });
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  console.table({ email, password });

  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please register",
      });
    }

    //authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and Password do not match",
      });
    }

    //generate token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: { _id, name, email, role },
    });
  });
};