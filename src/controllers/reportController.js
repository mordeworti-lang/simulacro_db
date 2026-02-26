'use strict';

const reportService = require('../services/reportService');

async function getRevenue(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const report = await reportService.getRevenueReport({ startDate, endDate });
        res.json({ ok: true, report });
    } catch (error) {
        next(error);
    }
}

module.exports = { getRevenue };