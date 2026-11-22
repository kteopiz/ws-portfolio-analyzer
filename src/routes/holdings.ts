import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import { HttpError } from '../errors/http-error.js';
import { parseHoldingsFile, type HoldingsParseResult } from '../parsers/holdings.js';

export const holdingsRouter = Router();

const TWO_MB = 2 << 20;

const limits = {
  fileSize: TWO_MB,
};

const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype !== 'text/csv') {
    return cb(
      new HttpError(
        `Holdings upload rejected: unsupported MIME type "${file.mimetype}"`,
        'Please upload a CSV file',
        415,
      ),
    );
  }
  return cb(null, true);
}

const upload = multer({
  limits: limits,
  storage: storage,
  fileFilter: fileFilter,
});

holdingsRouter.post('/holdings', upload.single('holdings'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const rawCsvFromMemory: string = req.file.buffer.toString('utf8');
  const result: HoldingsParseResult = parseHoldingsFile(rawCsvFromMemory);

  if (!result.ok) {
    console.error(result.diagnostics);
    return res.status(422).json({ message: result.parsingError });
  } else {
    return res.status(200).json({ data: result.data });
  }
});
