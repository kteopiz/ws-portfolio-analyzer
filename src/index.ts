import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();
const port = 3000;

// Serve homepage
app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});