import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import {
  expectedParsedHoldings,
  validHoldingsCsv,
  csvWithMissingFooter,
} from '../test-fixtures/holdings.js';

describe('POST /api/holdings', () => {
  it('returns 200 and parsed CSV rows with a valid upload', async () => {
    const response = await request(app)
      .post('/api/holdings')
      .attach('holdings', Buffer.from(validHoldingsCsv), {
        filename: 'holdings.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: expectedParsedHoldings,
    });
  });

  it('returns 415 with invalid MIME type', async () => {
    const response = await request(app)
      .post('/api/holdings')
      .attach('holdings', Buffer.from(validHoldingsCsv), {
        filename: 'holdings.csv',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(415);
    expect(response.text).toBe('Please upload a CSV file.');
  });

  it('returns 422 with a CSV deemed invalid after parsing', async () => {
    const response = await request(app)
      .post('/api/holdings')
      .attach('holdings', Buffer.from(csvWithMissingFooter), {
        filename: 'holdings.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      message: 'No date timestamp row exists',
    });
  });

  it('returns 413 with a file size > 2MiB', async () => {
    const response = await request(app)
      .post('/api/holdings')
      .attach('holdings', Buffer.alloc(2 * 1024 * 1024 + 1, 'x'), {
        filename: 'oversized.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(413);
    expect(response.text).toBe('This file is too large, it must be less than 2 megabytes');
  });

  it('returns 400 when no file is uploaded', async () => {
    const response = await request(app).post('/api/holdings');

    expect(response.status).toBe(400);
    expect(response.text).toBe('No file uploaded');
  });

  it('returns 422 when the uploaded file is empty', async () => {
    const response = await request(app).post('/api/holdings').attach('holdings', Buffer.alloc(0), {
      filename: 'empty.csv',
      contentType: 'text/csv',
    });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      message: 'The CSV file is empty.',
    });
  });
});
