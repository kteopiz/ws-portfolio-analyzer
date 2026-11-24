import { type Request } from 'express';
import multer from 'multer';

import { HttpError } from '../errors/http-error.js';

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

type UploadType = 'holdings' | 'activities';

export function csvUpload(type: UploadType) {
  const maxSizeMiB = type === 'holdings' ? 2 << 20 : 5 << 20;
  const upload = multer({
    limits: { fileSize: maxSizeMiB },
    storage: storage,
    fileFilter: fileFilter,
  });

  return upload.single(type);
}
