import express, { type Express, type Request, type Response, type ErrorRequestHandler } from 'express';
import multer from 'multer'

const app: Express = express();
const port = 3000;

class HttpError extends Error {
  constructor(
    logMessage: string,
    public clientMessage: string,
    public statusCode: number,
  ) {
    super(clientMessage);
  }
}

const TWO_MB  = 2 << 20; 

// Serve homepage
app.use(express.static('public'))

const limits = {
  fileSize: TWO_MB
}

// Use RAM, small uploads only
const storage = multer.memoryStorage()

function fileFilter(req : Request, file : Express.Multer.File , cb : multer.FileFilterCallback) {
  if (file.mimetype !== "text/csv") {
    return cb(new HttpError(
      `Holdings upload rejected: unsupported MIME type "${file.mimetype}"`,
      'Please upload a CSV file.',
      415
    ));
  }
  return cb(null, true);
}

const upload = multer({
  limits: limits,
  storage: storage,
  fileFilter: fileFilter
})

app.post('/api/holdings', upload.single('holdings'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send("No file uploaded")
  }

  res.status(200).json({
  fileReceived: Boolean(req.file),
  filename: req.file?.originalname,
  size: req.file?.size,
  mimetype: req.file?.mimetype,
  savedPath: req.file?.path,
  textFields: req.body,
});
})

const handleError: ErrorRequestHandler = (err, req, res, next) => {
  let errorMsg : string = "Something went wrong. Please try again.";
  // let logMsg : string = "Unknown error: " + err.message;
  // General default error code
  let statusCode : number = 500;
  
  if (err instanceof HttpError) {
    errorMsg = err.clientMessage;
    statusCode = err.statusCode;
  }

  // MulterError docs and their codes:
    // https://expressjs.com/en/resources/middleware/multer/#error-handling
    // https://github.com/expressjs/multer/blob/main/lib/multer-error.js
  else if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        errorMsg = "This file is too large, it must be less than 2 megabytes";
        statusCode = 413;
    }
  }

  res.status(statusCode).send(errorMsg);
  // TODO: Improve logging in future
  console.error(err)
};

app.use(handleError);

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});