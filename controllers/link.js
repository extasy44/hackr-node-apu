const AWS = require('aws-sdk');
const Link = require('../models/link');
const User = require('../models/user');
const Category = require('../models/category');
const { linkPublishedParams } = require('../helpers/email');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION
});

exports.create = (req, res) => {
  const { title, url, categories, type, medium, level } = req.body;

  let slug = url;
  let link = new Link({ title, url, categories, type, medium, slug, level });

  //Posted by user
  link.postedBy = req.user._id;

  //save
  link.save((err, data) => {
    if (err) {
      return res.status(400).json({
        eorr: 'Link already exist'
      });
    }

    res.json(data);

    //find all users in the category
    User.find({ categories: { $in: categories }, notification: true }).exec(
      (err, users) => {
        if (err) {
          throw new Error(err);
          console.log('Error finding user to send email on link submission');
        }

        Category.find({ _id: { $in: categories } }).exec((err, result) => {
          data.categories = result;

          for (let i; i < users.length; i++) {
            const params = linkPublishedParams(users[i].email, data);
            const sendEmail = ses.sendEmail(params).promise();

            sendEmail
              .then((success) => {
                console.log('email submitted to SES ', success);
                return;
              })
              .catch((failure) => {
                console.log('error on email submitted to SES ', failure);
                return;
              });
          }
        });
      }
    );
  });
};

exports.list = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  Link.find()
    .populate('postedBy', 'name')
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          eorr: 'Could not list links'
        });
      }
      res.json(data);
    });
};

exports.filteredList = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  const categoryId = req.body.categoryId;
  const filter = req.body.checkFilter;

  console.table(filter);

  Link.find({
    categories: categoryId,
    type: { $in: filter.type.length > 0 ? filter.type : /.*/ },
    medium: { $in: filter.medium.length > 0 ? filter.medium : /.*/ },
    level: { $in: filter.level.length > 0 ? filter.level : /.*/ }
  })
    .populate('postedBy', 'name')
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          eorr: 'Could not list links'
        });
      }
      res.json(data);
    });
};

exports.read = (req, res) => {
  const { id } = req.params;

  Link.findOne({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Error finding link'
      });
    }
    res.json(data);
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { title, url, categories, type, medium, level } = req.body;

  Link.findOneAndUpdate(
    { _id: id },
    { title, url, categories, type, medium, level },
    { new: true }
  ).exec((err, updated) => {
    if (err) {
      return res.status(400).json({
        error: 'Error updating link'
      });
    }

    res.json(updated);
  });
};

exports.remove = (req, res) => {
  const { id } = req.params;

  Link.findOneAndRemove({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Error deleting link'
      });
    }

    res.json({
      message: 'Link removed successfully'
    });
  });
};

exports.clickCount = (req, res) => {
  const { linkId } = req.body;

  Link.findByIdAndUpdate(
    linkId,
    { $inc: { clicks: 1 } },
    { upsert: true, new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not update click count'
      });
    }
    res.json(result);
  });
};

exports.popular = (req, res) => {
  Link.find()
    .populate('postedBy', 'name')
    .populate('categories', 'name slug')
    .sort({ clicks: -1 })
    .limit(8)
    .exec((err, links) => {
      if (err) {
        return res.status(400).json({
          error: 'Links not found'
        });
      }

      res.json(links);
    });
};
exports.popularInCategory = (req, res) => {
  const { slug } = req.params;

  Category.findOne({ slug }).exec((err, category) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not update click count'
      });
    }

    Link.find({ categories: category })
      .populate('categories', 'name slug')
      .populate('postedBy', 'name')
      .sort({ clicks: -1 })
      .limit(3)
      .exec((err, links) => {
        if (err) {
          return res.status(400).json({
            error: 'Links not found'
          });
        }
        res.json(links);
      });
  });
};
