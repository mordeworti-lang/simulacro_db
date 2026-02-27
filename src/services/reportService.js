'use strict';

const reportRepo = require('../repositories/reportRepository');

async function getRevenueReport({ startDate, endDate } = {}) {
    // Validar formato de fechas si se proveen
    if (startDate && isNaN(Date.parse(startDate))) {
        const error = new Error('Invalid startDate format. Use YYYY-MM-DD');
        error.statusCode = 400;
        throw error;
    }
    if (endDate && isNaN(Date.parse(endDate))) {
        const error = new Error('Invalid endDate format. Use YYYY-MM-DD');
        error.statusCode = 400;
        throw error;
    }

    const data = await reportRepo.getRevenueReport({ startDate, endDate });

    return {
        totalRevenue: data.totalRevenue,
        byInsurance: data.byInsurance,
        period: {
            startDate: startDate || null,
            endDate: endDate || null
        }
    };
}

module.exports = { getRevenueReport };