const mongoose = require('mongoose');

const MONGODB_URL = 'mongodb://localhost:27017/assignment_5';
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected successfully to MongoDB server');
    // Further code here
  })
  .catch(err => console.error('Connection error:', err));
