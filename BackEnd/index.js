const express = require('express');
const multer = require('multer');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan')
const request = require('request');
const util = require('util');


ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('C:/ffmpeg/bin/ffprobe.exe');

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, path.basename(file.originalname));
  }
});

// Create an instance of multer
const upload = multer({ storage: storage });

app.use(cors());
morgan.token('splitter', (req) => {
  return "\x1b[36m--------------------------------------------\x1b[0m\n";
});
morgan.token('statusColor', (req, res, args) => {
  // get the status code if response written
  var status = (typeof res.headersSent !== 'boolean' ? Boolean(res.header) : res.headersSent)
      ? res.statusCode
      : undefined

  // get status color
  var color = status >= 500 ? 31 // red
      : status >= 400 ? 33 // yellow
          : status >= 300 ? 36 // cyan
              : status >= 200 ? 32 // green
                  : 0; // no color

  return '\x1b[' + color + 'm' + status + '\x1b[0m';
});
app.use(morgan(`:splitter\x1b[33m:method\x1b[0m \x1b[36m:url\x1b[0m :statusColor :response-time ms - length|:res[content-length]`));

// Handle POST requests to /upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const uploadedFile = req.file;
  const filePath = uploadedFile.path;

  // Get the duration of the uploaded video using FFmpeg
  ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) {
      return res.status(500).send('Failed to get video duration.');
    } else {
      // Get the duration in seconds
      const duration = metadata.format.duration;
      const durationInSeconds = Math.floor(duration);
      const newFileName = uuidv4();
      // Check if the duration is greater than 9 seconds
      if (durationInSeconds > 1300) {
        const outputPath = path.join(__dirname, 'uploads', `${ newFileName }.mp4`); // Temporary file
        ffmpeg()
          .input(filePath)
          .seekInput(0)
          .duration(1300)
          .output(outputPath)
          .on('end', () => {
            // Remove the original file
            fs.unlinkSync(filePath);
            // Send success status as response
            res.status(200).json({ newFileName });
          })
          .on('error', (err) => {
            res.status(500).send('Failed to cut video.');
          })
          .run();
      } else {
        // Send success status as response
        const renamePath = path.join(__dirname, 'uploads');
        fs.rename(renamePath+'\\'+path.basename(req.file.originalname), renamePath+'\\'+newFileName+'.mp4', (error) => {
          if (error) {
            // Show the error 
            console.log(error);
          }
          else {
            // List all the filenames after renaming
            console.log("\nFile Renamed\n");
          }
        });
        res.status(200).json({ newFileName });
      }
    }
  });
});

app.use(express.json());

// Promisify the request.post() function
const requestPost = util.promisify(request.post);

app.post('/api/submit', async (req, res) => {
  if (req === NULL) {
    console.error(error);
    res.status(500).json({ error: 'No data contained!' });  
  } else {
    const options = req.body;

    // Access the checked options data
    const videoId = options.videoId;
    const color = options.colorOp;
    const upscale = options.scaleOp;
    const framerate = options.frameOp;
  
    console.log('Video Id:', videoId);
    console.log('Color Option:', color);
    console.log('Upscale Option:', upscale);
    console.log('Framerate Option:', framerate);
  
    try {
      const responses = [];
  
      if (upscale) {
        const response = await requestPost({ url: 'http://127.0.0.1:5555/scaling', json: true, body: { id: videoId } });
        responses.push(response);
      }
  
      if (framerate) {
        const response = await requestPost({ url: 'http://127.0.0.1:6666/framing', json: true, body: { id: videoId } });
        responses.push(response);
      }
  
      if (color) {
        const response = await requestPost({ url: 'http://127.0.0.1:4444/colorize', json: true, body: { id: videoId } });
        responses.push(response);
      }
  
  
      // Process responses as needed
      for (const response of responses) {
        // Do something with the response
        console.log('Response:', response.body);
      }

      res.json({ success: true });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send data to Flask server' });
    }
  };
});



// Start the server
app.listen(3333, () => {
  console.log('Server is listening on port 3333');
});
