const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

//MongoDB
mongoose
  .connect(process.env.DATABASE_CLOUD, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('MongoDB Connected..'))
  .catch((err) => console.log(err));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const linkRoutes = require('./routes/link');

//middlewares
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '3mb', type: 'application/json' }));
//app.use(cors());
app.use(cors({ origin: process.env.CLIENT_URL }));

//routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', linkRoutes);
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log('Server is running');
});
