'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const slidesRouter = require('./src/routes/slides');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'slide-creator' });
});

app.use('/api/slides', slidesRouter);

app.listen(PORT, () => {
  console.log(`slide-creator running on port ${PORT}`);
});
