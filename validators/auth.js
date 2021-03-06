const { check } = require('express-validator');

exports.userRegisterValidator = [
  check('name').not().isEmpty().withMessage('Name is required '),
  check('email').not().isEmpty().withMessage('email is required '),
  check('categories')
    .not()
    .isEmpty()
    .withMessage('please pick at least 1 category'),
  check('email').isEmail().withMessage('email is not valid'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long')
];

exports.userLoginValidator = [
  check('email').not().isEmpty().withMessage('email is required '),
  check('email').isEmail().withMessage('email is not valid'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long')
];

exports.forgotPasswordValidator = [
  check('email').isEmail().withMessage('email is not valid')
];

exports.resetPasswordValidator = [
  check('newPassword')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),
  check('resetPasswordLink').not().isEmpty().withMessage('Token required')
];

exports.userUpdateValidator = [
  check('name').not().isEmpty().withMessage('Name is required ')
];
