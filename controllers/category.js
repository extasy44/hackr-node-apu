const Category = require('../models/category');
const slugify = require('slugify');
const formidable = require('formidable');
const AWS = require('aws-sdk');
const { v4 } = require('uuid');
const fs = require('fs');
const Link = require('../models/link');

//s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
  region: process.env.AWS_REGION
});

exports.create1 = (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could  not upload'
      });
    }

    const { name, content } = fields;
    const { image } = files;
    const slug = slugify(name);
    let category = new Category({ name, content, slug });

    if (image.size > 2000000) {
      return res.status(400).json({
        error: 'Image should be less than 2mb'
      });
    }

    //upload to S3
    const params = {
      Bucket: 'hackr-heejun',
      Key: `category/${v4()}`,
      Body: fs.readFileSync(image.path),
      ACL: 'public-read',
      ContentType: 'image/jpg'
    };

    s3.upload(params, (err, data) => {
      if (err) res.status(400).json({ error: 'Upload to s3 failed' });
      console.log('AWS UPLOAD RES DATA', data);
      category.image.url = data.Location;
      category.image.key = data.key;

      // save to db
      category.save((err, success) => {
        if (err) res.status(400).json({ error: 'Error saving category' });
        return res.json(success);
      });
    });
  });
};

exports.create = (req, res) => {
  const { name, image, content } = req.body;
  const slug = slugify(name);
  let category = new Category({ name, content, slug });

  //image data
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );
  const type = image.split(';')[0].split('/')[1];

  //upload to S3
  const params = {
    Bucket: 'hackr-heejun',
    Key: `category/${v4()}.${type}`,
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: `image/${type}`
  };

  s3.upload(params, (err, data) => {
    if (err) res.status(400).json({ error: 'Upload to s3 failed' });
    console.log('AWS UPLOAD RES DATA', data);
    category.image.url = data.Location;
    category.image.key = data.Key;
    category.postedBy = req.user._id;

    // save to db
    category.save((err, success) => {
      if (err) res.status(400).json({ error: 'Error saving category' });
      return res.json(success);
    });
  });
};

exports.list = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Categories could not load'
      });
    }

    res.json(data);
  });
};

exports.read = (req, res) => {
  const { slug } = req.params;
  console.log(req.body);

  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  Category.findOne({ slug })
    .populate('postedBy', '_id name username')
    .exec((err, category) => {
      if (err) {
        return res.status(400).json({
          error: 'Could not load category'
        });
      }
      //res.json(category);
      Link.find({ categories: category })
        .populate('postedBy', ' _id name username')
        .populate('categories', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec((err, links) => {
          if (err) {
            return res.status(400).json({
              error: 'Could not load links'
            });
          }
          res.json({ category, links });
        });
    });
};

exports.update = (req, res) => {
  const { slug } = req.params;
  const { name, image, content } = req.body;

  //image data
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );
  const type = image.split(';')[0].split('/')[1];

  Category.findOneAndUpdate({ slug }, { name, content }, { new: true }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: 'Could not update category'
        });
      }
      console.log('Category updated : ', updated);

      if (image) {
        //remove existing image from s3 before uploading new image
        const deleteParams = {
          Bucket: 'hackr-heejun',
          Key: updated.image.key
        };

        s3.deleteObject(deleteParams, function (err, data) {
          if (err) {
            console.log('Error deleting image from S3', err);
          } else {
            console.log('Image delete from S3');
          }
        });

        //upload to S3
        const params = {
          Bucket: 'hackr-heejun',
          Key: `category/${v4()}.${type}`,
          Body: base64Data,
          ACL: 'public-read',
          ContentEncoding: 'base64',
          ContentType: `image/${type}`
        };

        s3.upload(params, (err, data) => {
          if (err) res.status(400).json({ error: 'Upload to s3 failed' });
          console.log('AWS UPLOAD RES DATA', data);
          updated.image.url = data.Location;
          updated.image.key = data.Key;

          // save to db
          updated.save((err, success) => {
            if (err) res.status(400).json({ error: 'Error saving category' });
            return res.json(success);
          });
        });
      } else {
        res.json(updated);
      }
    }
  );
};

exports.remove = (req, res) => {
  const { slug } = req.params;

  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not load category'
      });
    }

    //remove image from S3
    const deleteParams = {
      Bucket: 'hackr-heejun',
      Key: data.image.key
    };

    s3.deleteObject(deleteParams, function (err, data) {
      if (err) {
        console.log('Error deleting image from S3', err);
      } else {
        console.log('Image deleted from S3', data);
      }
    });

    res.json({
      message: 'Category deleted successfully'
    });
  });
};
