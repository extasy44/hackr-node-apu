const express = require('express');
const router = express.Router();

const {
  linkCreateValidator,
  linkUpdateValidator
} = require('../validators/link');

const {
  requireSignIn,
  authMiddleware,
  adminMiddleware,
  canUpdateDeleteLink
} = require('../controllers/auth');
const { runValidation } = require('../validators');

const {
  create,
  list,
  read,
  update,
  remove,
  clickCount,
  filteredList,
  popularInCategory,
  popular
} = require('../controllers/link');
//routes

router.post(
  '/link',
  linkCreateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  create
);

router.post('/links', requireSignIn, adminMiddleware, list);
router.post('/filter-links', filteredList);

router.get('/link/popular', popular);
router.get('/link/popular/:slug', popularInCategory);
router.get('/link/:id', read);

router.put(
  '/link/:id',
  linkUpdateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  canUpdateDeleteLink,
  update
);

router.put(
  '/link/admin/:id',
  linkUpdateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  update
);

router.delete('/link/admin/:id', requireSignIn, adminMiddleware, remove);

router.delete(
  '/link/:id',
  requireSignIn,
  authMiddleware,
  canUpdateDeleteLink,
  remove
);

router.put('/click-count', clickCount);
module.exports = router;
