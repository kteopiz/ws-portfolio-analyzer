import { Router, type Request, type Response } from 'express';

import { csvUpload } from '../middleware/csv-upload.js';
import { parseActivitiesFile, type ActivitiesParseResult } from '../parsers/activities.js';

export const activitiesRouter = Router();

activitiesRouter.post('/activities', csvUpload('activities'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const rawCsvFromMemory: string = req.file.buffer.toString('utf8');
  const result: ActivitiesParseResult = parseActivitiesFile(rawCsvFromMemory);

  if (!result.ok) {
    console.error(result.diagnostics);
    return res.status(422).json({ message: result.parsingError, issues: result.issues });
  } else {
    return res.status(200).json({ data: result.data });
  }
});
