const AWS = require('aws-sdk');
const User = require('../models/user');
const Link = require('../models/link');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const shortId = require('shortid');
const _ = require('lodash');
const {
  registerEmailParams,
  forgotPasswordEmailParams
} = require('../helpers/email');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

exports.register = (req, res) => {
  const { name, email, password, categories } = req.body;

  //Check if user exists
  User.findOne({ email }).exec((err, user) => {
    //if user exists send error
    if (user) {
      return res.state(400).json({
        error: 'Email exist'
      });
    }

    // If user not exist, then create a token for email activation
    const token = jwt.sign(
      { name, email, password, categories },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: '10m'
      }
    );

    // Send Email
    const params = registerEmailParams(email, token);

    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log('Email submitted to SES');
        res.json({
          message: `Email has been sent to ${email}, Follow the instructions to complete your registration`
        });
      })
      .catch((error) => {
        console.log('SES Email on Register ', error);
        res.json({
          message: `We could not verify your email, please try again!`
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
      return res.status(401).json({
        error: 'Expired link, Try again'
      });
    }

    const { name, email, password, categories } = jwt.decode(token);
    const username = shortId.generate();

    User.findOne({ email }).exec((err, user) => {
      if (user) {
        return res.status(401).json({
          error: 'You are already registered'
        });
      }

      //create new user
      const newUser = new User({ username, name, email, password, categories });
      console.log(categories);
      newUser.save((err, user) => {
        if (err) {
          return res.status(401).json({
            error: 'Error saving user, try later'
          });
        }

        return res.json({
          message: 'Registration Success, Please login'
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
        error: 'User with that email does not exist. Please register'
      });
    }

    //authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Email and Password do not match'
      });
    }

    //generate token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: { _id, name, email, role }
    });
  });
};

exports.requireSignIn = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
});

exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;

  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    req.profile = user;

    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  const authUserId = req.user._id;

  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        error: 'Access Denied, Admin required'
      });
    }

    req.profile = user;

    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  //check if user exists with that email
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    //generate token send email to user
    const token = jwt.sign(
      { name: user.name },
      process.env.JWT_RESET_PASSWORD,
      { expiresIn: '10m' }
    );

    //send email
    const params = forgotPasswordEmailParams(email, token);

    //populate DB > user > resetPasswordLink

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: 'Password reset failed. Try later.'
        });
      }

      const sendEmail = ses.sendEmail(params).promise();
      sendEmail
        .then((data) => {
          console.log('ses reset password link sent', data);
          return res.json({
            message: `Email has been sent to ${email}. Click on the link to reset your password`
          });
        })
        .catch((error) => {
          return res.json({
            message: 'We could not find the email, try again'
          });
        });
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    //check for expiry
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      (err, success) => {
        if (err) {
          return res.status(400).json({
            error: 'Expired Link, Try again'
          });
        }
      }
    );

    User.findOne({ resetPasswordLink }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: 'Invalid token. Try again'
        });
      }

      const updatedFields = {
        password: newPassword,
        resetPasswordLink: ''
      };

      user = _.extend(user, updatedFields);

      user.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: 'Password reset faild. Try again'
          });
        }

        res.json({
          message:
            'Your password has been updated, please login with your new password'
        });
      });
    });
  }
};

exports.canUpdateDeleteLink = (req, res, next) => {
  const { id } = req.params;

  Link.findOne({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not find link'
      });
    }

    const authorizedUser =
      data.postedBy._id.toString() === req.user._id.toString();

    if (!authorizedUser) {
      return res.status(400).json({
        error: 'You are not authorized'
      });
    }

    next();
  });
};
