const { check } = require('express-validator');

exports.linkCreateValidator = [
  check('title').not().isEmpty().withMessage('title is required '),
  check('url').not().isEmpty().withMessage('URL is required '),
  check('categories').not().isEmpty().withMessage('Select a category'),
  check('type').not().isEmpty().withMessage('Select a type free/paid'),
  check('medium').not().isEmpty().withMessage('Select a medium video/book'),
  check('level').not().isEmpty().withMessage('Select a level beginner/advanced')
];

exports.linkUpdateValidator = [
  check('title').not().isEmpty().withMessage('title is required '),
  check('url').not().isEmpty().withMessage('URL is required '),
  check('categories').not().isEmpty().withMessage('Select a category'),
  check('type').not().isEmpty().withMessage('Select a type free/paid'),
  check('medium').not().isEmpty().withMessage('Select a medium video/book'),
  check('level').not().isEmpty().withMessage('Select a level beginner/advanced')
];
