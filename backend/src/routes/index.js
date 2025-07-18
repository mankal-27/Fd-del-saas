// This file collects all route modules and mounts them under /api

const express = require("express");
const router = express.Router();

const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const analyticsRoutes = require('./analyticsRoutes');

router.use('/auth', authRoutes); // /api/auth/*
router.use('/orders', orderRoutes); // /api/orders/*
router.use('/analytics', analyticsRoutes); // /api/analytics/*

module.exports = router;