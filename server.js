const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Enable CORS using the cors middleware
app.use(cors());

// Serve static files
app.use(express.static('video-player'));

// Serve static files from the "uploads" directory
app.use('/uploads', express.static('uploads'));

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection setup
// Replace <db-url> with your MongoDB connection URL
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Set up schemas
const User = require('./models/User');
const Video = require('./models/Video');

// POST Registration route (not protected)
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      password: hashedPassword,
    });

    // Save the user to the database
    await user.save();

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST Login route (not protected)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user in the database
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate a JWT for authentication
    const token = jwt.sign({ userId: user._id }, 's3cur3S3cr3tK3y#2023');

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET Dashboard route (protected)
app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Retrieve the user ID from the authentication middleware
    const userId = req.user.userId;

    // Find the user from the database based on the ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Specify the destination folder for uploaded videos
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

// Set up multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // Maximum file size of 30MB
  },
});

// POST Upload route (protected)
app.post('/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    // Access the uploaded file using req.file
    const videoFile = req.file;

    // Check if file size exceeds the limit
    if (videoFile.size > 30 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds the limit' });
    }

    // Move the uploaded file to the designated folder
    const destinationFolder = 'uploads/';
    const destinationPath = destinationFolder + videoFile.originalname;
    fs.renameSync(videoFile.path, destinationPath);

    // Save the video metadata in the database
    const video = new Video({
      title: req.body.title,
      description: req.body.description,
      filename: videoFile.originalname,
      path: destinationPath,
      user: req.user.userId, // Assuming you have authenticated the user
    });

    // Save the video document to the database
    await video.save();

    res.json({ message: 'Video uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET All Videos route (protected)
app.get('/videos', authenticateToken, async (req, res) => {
  try {
    // Retrieve the user ID from the authentication middleware
    const userId = req.user.userId;

    // Fetch all videos associated with the user from the database
    const videos = await Video.find({ user: userId });

    res.json({ videos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// TODO: Check protection status
// GET All users (not protected)
app.get('/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET Video by id route (protected)
app.get('/videos/:videoId', authenticateToken, async (req, res) => {
  const videoId = req.params.videoId;

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (err) {
    console.error('Error fetching video:', err);
    res.status(500).json({ error: 'An error occurred while fetching the video' });
  }
});

// POST Annotation to Video (protected)
app.post('/videos/:videoId/annotations', authenticateToken, async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const { second, rectangle, description, dropdownValue } = req.body;

    // Find the video by ID
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Create a new annotation object
    const annotation = {
      second,
      rectangle,
      description,
      dropdownValue
    };

    // Add the annotation to the video's annotations array
    video.annotations.push(annotation);

    // Save the updated video
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE Annotation from Video (protected)
app.delete('/videos/:videoId/annotations/:annotationId', authenticateToken, async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const annotationId = req.params.annotationId;

    // Find the video by ID
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Find the index of the annotation to be deleted
    const annotationIndex = video.annotations.findIndex(
        (annotation) => annotation._id.toString() === annotationId
    );

    if (annotationIndex === -1) {
      return res.status(404).json({ error: 'Annotation not found' });
    }

    // Remove the annotation from the array
    video.annotations.splice(annotationIndex, 1);

    // Save the updated video
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Search Videos (protected)
app.get('/search', authenticateToken, async (req, res) => {
  try {
    const searchQuery = req.query.title.toString(); // Get the search query from the request parameters

    // Perform the search query in your database
    // Replace this code with your actual search implementation
    const searchResults = await Video.find({ title: { $regex: searchQuery, $options: 'i' } });

    res.json({ videos: searchResults }); // Return the search results as JSON
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'An error occurred during the search.' });
  }
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('No token found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, 's3cur3S3cr3tK3y#2023', (err, user) => {
    if (err) {
      console.log('Invalid token:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }

    console.log('Token verified successfully');
    req.user = user;
    next();
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
