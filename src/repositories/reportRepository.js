'use strict';

const { pool } = require('../config/postgres');

async function getRevenueReport({ startDate, endDate } = {}) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
        whereClause = `WHERE a.appointment_date BETWEEN $1 AND $2`;
        params.push(startDate, endDate);
    } else if (startDate) {
        whereClause = `WHERE a.appointment_date >= $1`;
        params.push(startDate);
    } else if (endDate) {
        whereClause = `WHERE a.appointment_date <= $1`;
        params.push(endDate);
    }

    const query = `
        SELECT 
            i.name AS insurance_name,
            SUM(a.amount_paid) AS total_amount,
            COUNT(a.id) AS appointment_count
        FROM appointment a
        LEFT JOIN insurance i ON i.id = a.insurance_id
        ${whereClause}
        GROUP BY i.name
        ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, params);

    // Total general
    const totalQuery = `
        SELECT COALESCE(SUM(amount_paid), 0) AS total
        FROM appointment a
        ${whereClause}
    `;
    const totalResult = await pool.query(totalQuery, params);

    return {
        totalRevenue: parseFloat(totalResult.rows[0].total),
        byInsurance: result.rows.map(row => ({
            insuranceName: row.insurance_name || 'Sin Seguro',
            totalAmount: parseFloat(row.total_amount),
            appointmentCount: parseInt(row.appointment_count)
        }))
    };
}

module.exports = { getRevenueReport };