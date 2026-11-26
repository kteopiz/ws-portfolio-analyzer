import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import {
  validActivitiesCsv,
  expectedParsedActivities,
  csvWithTooFewFields,
  csvWithMultipleInvalidRows,
  csvWithEmptyFile,
} from '../test-fixtures/activities.js';

describe('POST /api/activities', () => {
  it('returns 200 and parsed rows with a valid upload', async () => {
    const response = await request(app)
      .post('/api/activities')
      .attach('activities', Buffer.from(validActivitiesCsv), {
        filename: 'activities.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: expectedParsedActivities });
  });

  it('returns 400 when no file is uploaded', async () => {
    const response = await request(app).post('/api/activities');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'No file uploaded' });
  });

  it('returns 415 with an unsupported MIME type', async () => {
    const response = await request(app)
      .post('/api/activities')
      .attach('activities', Buffer.from(validActivitiesCsv), {
        filename: 'activities.csv',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(415);
    expect(response.body).toEqual({ message: 'Please upload a CSV file' });
  });

  it('returns 413 when the upload exceeds 5 MiB', async () => {
    const response = await request(app)
      .post('/api/activities')
      .attach('activities', Buffer.alloc(5 * 1024 * 1024 + 1, 'x'), {
        filename: 'oversized.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      message: 'This file is too large, it must be less than 5 megabytes',
    });
  });

  it('returns 422 for an empty CSV upload', async () => {
    const response = await request(app)
      .post('/api/activities')
      .attach('activities', Buffer.from(csvWithEmptyFile), {
        filename: 'empty.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ message: 'The CSV file is empty' });
  });

  it('returns 422 and a message for a CSV parsing error', async () => {
    const response = await request(app)
      .post('/api/activities')
      .attach('activities', Buffer.from(csvWithTooFewFields), {
        filename: 'invalid.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      message: 'CSV record 1 has fewer columns than the header',
    });
  });

  it('returns 422 with all row issues grouped under their original records', async () => {
    const response = await request(app)
      .post('/api/activities')
      .attach('activities', Buffer.from(csvWithMultipleInvalidRows), {
        filename: 'invalid-rows.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      message: 'Some activity rows need correction',
      issues: [
        {
          record: 1,
          fieldIssues: {
            fields: ['symbol'],
            code: 'REQUIRED_FIELD',
            message: 'Required values empty',
          },
          timestampIssues: [],
        },
        {
          record: 3,
          fieldIssues: null,
          timestampIssues: [
            {
              field: 'effective_date',
              code: 'INVALID_DATE',
              message: 'Effective date must be a valid date in YYYY-MM-DD format',
            },
          ],
        },
        {
          record: 5,
          fieldIssues: {
            fields: ['quantity'],
            code: 'REQUIRED_FIELD',
            message: 'Required values empty',
          },
          timestampIssues: [
            {
              field: 'effective_time',
              code: 'INVALID_TIME',
              message: 'Effective time must be a valid time in HH:mm:ss format',
            },
          ],
        },
      ],
    });
  });
});
