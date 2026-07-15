'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DEFAULT_HISTORY_ROOT = 'D:\\AI_Workspace\\Projects\\LPs_Entrelacos\\public\\carrosseis\\history';
const historyRoot = process.env.CAROUSEL_HISTORY_ROOT || DEFAULT_HISTORY_ROOT;
const indexPath = path.join(historyRoot, 'index.json');

function toOsPath(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('/slides/')) return value;
  if (value.startsWith('/carrosseis/')) return `/slides${value}`;
  return value;
}

function normalizeItem(item) {
  const files = Array.isArray(item.files)
    ? item.files.map((file) => ({
        ...file,
        path: toOsPath(file.path),
      }))
    : [];

  return {
    ...item,
    coverImage: toOsPath(item.coverImage),
    historyPath: toOsPath(item.historyPath || `/carrosseis/history/${item.id}/`),
    files,
  };
}

router.get('/history', (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.json({
      version: 1,
      updatedAt: null,
      items: [],
      stats: {
        totalItems: 0,
        totalSlides: 0,
        generatedItems: 0,
      },
      source: {
        historyRoot,
        indexPath,
        available: false,
      },
    });
  }

  try {
    const history = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const items = Array.isArray(history.items) ? history.items.map(normalizeItem) : [];
    const totalSlides = items.reduce((sum, item) => sum + (Number(item.slideCount) || 0), 0);
    const generatedItems = items.filter((item) => item.status !== 'legacy-import').length;

    res.json({
      version: history.version || 1,
      updatedAt: history.updatedAt || null,
      items,
      stats: {
        totalItems: items.length,
        totalSlides,
        generatedItems,
      },
      source: {
        historyRoot,
        indexPath,
        available: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to read carousel history: ${error.message}`,
      source: {
        historyRoot,
        indexPath,
        available: fs.existsSync(indexPath),
      },
    });
  }
});

module.exports = {
  carouselHistoryRoot: historyRoot,
  carouselsRouter: router,
};
