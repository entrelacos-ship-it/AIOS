'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const slidesRouter = require('./src/routes/slides');
const { carouselHistoryRoot, carouselsRouter } = require('./src/routes/carousels');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));
app.use('/slides', express.static(publicDir));
app.use('/carrosseis/history', express.static(carouselHistoryRoot));
app.use('/slides/carrosseis/history', express.static(carouselHistoryRoot));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'slide-creator' });
});

app.use('/api/slides', slidesRouter);
app.use('/slides/api/slides', slidesRouter);
app.use('/api/carousels', carouselsRouter);
app.use('/slides/api/carousels', carouselsRouter);

app.get(['/carrosseis', '/slides/carrosseis'], (req, res) => {
  res.sendFile(path.join(publicDir, 'carrosseis.html'));
});

app.listen(PORT, () => {
  console.log(`slide-creator running on port ${PORT}`);
});
