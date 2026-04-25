const { getPool, DB_NAME } = require('./src/db/connection');

(async () => {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(`USE \`${DB_NAME}\``);

    const from = '2026-04-25 00:00:00';
    const to = '2026-04-26 23:59:59';

    const [sales] = await conn.query(
      `SELECT id, invoice_no, payment_method, payment_status, amount_paid, grand_total, created_at
       FROM sales
       WHERE invoice_no = ?`,
      ['48808']
    );
    console.log('SALE', JSON.stringify(sales, null, 2));

    const [paymentsInRange] = await conn.query(
      `SELECT id, sale_id, amount, method, paid_at
       FROM invoice_payments
       WHERE sale_id = ?
         AND paid_at >= ?
         AND paid_at <= ?
       ORDER BY id`,
      [51341, from, to]
    );
    console.log('PAYMENTS_IN_RANGE', JSON.stringify(paymentsInRange, null, 2));

    const [listLikeReport] = await conn.query(
      `SELECT s.id, s.invoice_no, s.created_at, s.payment_method, s.payment_status, s.amount_paid, s.grand_total
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE (
         (s.created_at >= CAST(? AS DATETIME) AND s.created_at <= CAST(? AS DATETIME))
         OR EXISTS (
           SELECT 1 FROM invoice_payments ip
           WHERE ip.sale_id = s.id
             AND ip.paid_at >= CAST(? AS DATETIME)
             AND ip.paid_at <= CAST(? AS DATETIME)
         )
       )
       ORDER BY s.id DESC
       LIMIT 20`,
      [from, to, from, to]
    );
    console.log('LIST_QUERY_SAMPLE', JSON.stringify(listLikeReport, null, 2));

    const [partialEndpointRows] = await conn.query(
      `SELECT p.id, p.sale_id, p.amount, p.method, p.paid_at, s.invoice_no
       FROM invoice_payments p
       INNER JOIN sales s ON s.id = p.sale_id
       WHERE p.paid_at >= CAST(? AS DATETIME)
         AND p.paid_at <= CAST(? AS DATETIME)
         AND (s.doc_type IS NULL OR s.doc_type <> 'credit_note')
         AND s.invoice_no NOT LIKE 'CN-%'
         AND s.payment_method = 'credit'
       ORDER BY p.paid_at ASC, p.id ASC`,
      [from, to]
    );
    console.log('PARTIAL_ENDPOINT_ROWS', JSON.stringify(partialEndpointRows, null, 2));
  } finally {
    conn.release();
    await pool.end();
  }
})();
