import { Router, type Request, type Response } from 'express';

import { csvUpload } from '../middleware/csv-upload.js';
import { parseHoldingsFile, type HoldingsParseResult } from '../parsers/holdings.js';

export const holdingsRouter = Router();

holdingsRouter.post('/holdings', csvUpload('holdings'), (req: Request, res: Response) => {
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
