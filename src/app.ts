import express, { type Express, type ErrorRequestHandler } from 'express';
import multer from 'multer';

import { HttpError } from './errors/http-error.js';
import { holdingsRouter } from './routes/holdings.js';

export const app: Express = express();

// Serve homepage
app.use(express.static('public'));
app.use('/api', holdingsRouter);

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  let errorMsg: string = 'Something went wrong. Please try again.';
  // General default error code
  let statusCode: number = 500;

  if (err instanceof HttpError) {
    errorMsg = err.clientMessage;
    statusCode = err.statusCode;
  }

  // MulterError docs and their codes:
  // https://expressjs.com/en/resources/middleware/multer/#error-handling
  // https://github.com/expressjs/multer/blob/main/lib/multer-error.js
  else if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        // err.field is of type holdings | activities
        errorMsg = `This file is too large, it must be less than ${err.field === 'holdings' ? 2 : 5} megabytes`;
        statusCode = 413;
    }
  }

  res.status(statusCode).json({ message: errorMsg });
  // TODO: Improve logging in future
  console.error(err);
};

app.use(handleError);
