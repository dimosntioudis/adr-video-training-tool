const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  frameNumber : { type: Number, required: true},
  second: { type: Number, required: true },
  rectangle: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  description: { type: String, required: true },
  dropdownValue: { type: String, required: true },
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  annotations: [annotationSchema],
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
