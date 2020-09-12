const express = require('express');
const router = express.Router();

const {
  categoryCreateValidator,
  categoryUpdateValidator
} = require('../validators/category');

const { requireSignIn, adminMiddleware } = require('../controllers/auth');
const { runValidation } = require('../validators');

const {
  create,
  list,
  read,
  update,
  remove
} = require('../controllers/category');
//routes

router.post(
  '/category',
  categoryCreateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  create
);

router.get('/category', list);

router.post('/category/:slug', read);

router.put(
  '/category/:slug',
  categoryUpdateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  update
);

router.delete('/category/:slug', requireSignIn, adminMiddleware, remove);

module.exports = router;
