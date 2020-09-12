const { check } = require('express-validator');

exports.categoryCreateValidator = [
  check('name').not().isEmpty().withMessage('Category name is required '),
  check('image').not().isEmpty().withMessage('image is required '),
  check('content').not().isEmpty().withMessage('Content is required'),
  check('content')
    .isLength({ min: 20 })
    .withMessage('Content should have more than 20 charactors')
];

exports.categoryUpdateValidator = [
  check('name').not().isEmpty().withMessage('Category name is required '),
  check('content').not().isEmpty().withMessage('content is not valid'),
  check('content')
    .isLength({ min: 20 })
    .withMessage('Content should have more than 20 charactors')
];
