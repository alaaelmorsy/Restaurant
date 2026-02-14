const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const zlib = require('zlib');
const { promisify } = require('util');
const { getPool, DB_NAME } = require('../db/connection');

const gzipAsync = promisify(zlib.gzip);

const DEFAULT_API_PORT = Number(process.env.PRIMARY_API_PORT || process.env.API_PORT || 4310);
const DEFAULT_API_HOST = process.env.PRIMARY_API_HOST || '0.0.0.0';

let serverInstance = null;

function parseInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function compressApiResponse(data) {
  try {
    const jsonString = JSON.stringify(data);
    const jsonBuffer = Buffer.from(jsonString, 'utf8');
    
    if (jsonBuffer.length < 1024) {
      return { compressed: false, data };
    }
    
    const compressed = await gzipAsync(jsonBuffer);
    const ratio = compressed.length / jsonBuffer.length;
    
    if (ratio > 0.9) {
      return { compressed: false, data };
    }
    
    return {
      compressed: true,
      data: compressed.toString('base64'),
      originalSize: jsonBuffer.length,
      compressedSize: compressed.length
    };
  } catch (e) {
    console.error('API compression error:', e);
    return { compressed: false, data };
  }
}

async function withConnection(fn) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(`USE \`${DB_NAME}\``);
    return await fn(conn);
  } finally {
    conn.release();
  }
}

function buildProductFilters(query) {
  const clauses = [];
  const params = [];
  if (query.q) {
    const keyword = `%${query.q.trim()}%`;
    clauses.push('(name LIKE ? OR name_en LIKE ? OR barcode LIKE ?)');
    params.push(keyword, keyword, keyword);
  }
  if (query.category) {
    clauses.push('category = ?');
    params.push(query.category);
  }
  if (query.active === '0' || query.active === '1') {
    clauses.push('is_active = ?');
    params.push(Number(query.active));
  }
  if (query.exclude_no_category === '1') {
    clauses.push('category IS NOT NULL AND category != ""');
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

function buildProductOrdering(sort) {
  if (sort === 'custom') return 'ORDER BY sort_order ASC, is_active DESC, name ASC';
  if (sort === 'name_asc') return 'ORDER BY name ASC';
  if (sort === 'price_asc') return 'ORDER BY price ASC';
  if (sort === 'price_desc') return 'ORDER BY price DESC';
  if (sort === 'stock_desc') return 'ORDER BY stock DESC';
  return 'ORDER BY id DESC';
}

async function fetchProducts(query) {
  return withConnection(async (conn) => {
    const { where, params } = buildProductFilters(query);
    const order = buildProductOrdering(query.sort);
    const limit = Math.min(10000, Math.max(0, parseInteger(query.limit, 100)));
    const offset = Math.max(0, parseInteger(query.offset, 0));
    
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) as total FROM products ${where}`, params);
    
    const fields = query.fields || 'id,name,name_en,barcode,price,stock,category,is_active,sort_order';
    let sql = `SELECT ${fields} FROM products ${where} ${order}`;
    const finalParams = [...params];
    if (limit > 0) {
      sql += ' LIMIT ? OFFSET ?';
      finalParams.push(limit, offset);
    }
    const [rows] = await conn.query(sql, finalParams);
    
    if (query.compress_images && rows.length > 0) {
      rows.forEach(row => {
        if (row.image_path && row.image_path.length > 1000) {
          row.image_path = null;
        }
      });
    }
    
    return { ok: true, items: rows, count: rows.length, total: Number(total) };
  });
}

async function fetchProductById(id) {
  if (!id) return { ok: false, error: 'missing id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id,name,name_en,barcode,price,stock,category,description,image_path,image_mime,is_tobacco,is_active,sort_order,created_at FROM products WHERE id=? LIMIT 1', [id]);
    if (!rows.length) return { ok: false, error: 'not found' };
    return { ok: true, item: rows[0] };
  });
}

async function fetchProductByBarcode(barcode) {
  if (!barcode) return { ok: false, error: 'missing barcode' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id,name,name_en,barcode,price,stock,category,description,image_path,image_mime,is_tobacco,is_active,sort_order,created_at FROM products WHERE barcode=? LIMIT 1', [barcode]);
    if (!rows.length) return { ok: false, error: 'not found' };
    return { ok: true, item: rows[0] };
  });
}

function buildInvoiceFilters(query) {
  const clauses = [];
  const params = [];
  if (query.q) {
    const keyword = `%${query.q.trim()}%`;
    // Search in both sales snapshot fields and customers table (match sales.js behavior)
    clauses.push('(s.invoice_no LIKE ? OR s.payment_method LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR c.phone LIKE ? OR c.name LIKE ? OR c.vat_number LIKE ?)');
    params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
  }
  if (query.payment_method) {
    clauses.push('s.payment_method = ?');
    params.push(query.payment_method);
  }
  if (query.status) {
    clauses.push('s.payment_status = ?');
    params.push(query.status);
  }
  if (query.type === 'credit') {
    clauses.push("s.doc_type='credit_note'");
  } else if (query.type === 'invoice') {
    clauses.push("(s.doc_type IS NULL OR s.doc_type='invoice')");
  }
  if (query.date_from) {
    clauses.push('s.created_at >= ?');
    params.push(query.date_from);
  }
  if (query.date_to) {
    clauses.push('s.created_at <= ?');
    params.push(query.date_to);
  }
  if (query.user_id) {
    clauses.push('s.created_by_user_id = ?');
    params.push(Number(query.user_id));
  }
  if (query.customer_q) {
    const v = `%${String(query.customer_q).trim()}%`;
    clauses.push('(s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR s.customer_name LIKE ? OR c.phone LIKE ? OR c.name LIKE ? OR c.vat_number LIKE ?)');
    params.push(v, v, v, v, v, v);
  }
  if (query.customer_id) {
    clauses.push('s.customer_id = ?');
    params.push(Number(query.customer_id));
  }
  if (query.customers_only) {
    clauses.push('(s.customer_id IS NOT NULL OR s.customer_name IS NOT NULL)');
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function fetchInvoices(query) {
  return withConnection(async (conn) => {
    // Handle exact invoice number search first (before building filters)
    if(query.q){
      const toAsciiDigits = (s) => String(s||'').replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0));
      const raw = String(query.q).trim();
      const qstr = toAsciiDigits(raw);
      const digitsOnly = /^[0-9]+$/.test(qstr);
      
      if(digitsOnly){
        // Try exact match first (include customer data and ZATCA fields)
        const [exRows] = await conn.query(`SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone 
          FROM sales s LEFT JOIN customers c ON c.id = s.customer_id 
          WHERE s.invoice_no = ? LIMIT 1`, [qstr]);
        if(exRows.length){ 
          return { ok:true, items: exRows, total: 1, count: 1, limit: 1, offset: 0 }; 
        }
        
        // Try numeric cast match (ignoring leading zeros)
        const n = Number(qstr);
        if(!Number.isNaN(n)){
          const [exCast] = await conn.query(`SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone 
            FROM sales s LEFT JOIN customers c ON c.id = s.customer_id 
            WHERE CAST(s.invoice_no AS UNSIGNED) = ? LIMIT 1`, [n]);
          if(exCast.length){ 
            return { ok:true, items: exCast, total: 1, count: 1, limit: 1, offset: 0 }; 
          }
        }
        // If no exact match, fall through to fuzzy search
      }
    }
    
    const { where, params } = buildInvoiceFilters(query);
    
    // إذا تم تحديد limit, استخدمه (بحد أقصى 50000 فاتورة)
    // إذا لم يتم تحديده, أرجع كل الفواتير (للتقارير)
    const limit = query.limit !== undefined ? Math.min(50000, Math.max(0, parseInteger(query.limit, 0))) : 0;
    const offset = Math.max(0, parseInteger(query.offset, 0));
    
    // حساب العدد الإجمالي للفواتير (include customers table in count for consistency)
    const countSql = `SELECT COUNT(*) as total FROM sales s LEFT JOIN customers c ON c.id = s.customer_id ${where}`;
    const [[countRow]] = await conn.query(countSql, params);
    const total = Number(countRow?.total || 0);
    
    // استرجاع جميع حقول s.* بالإضافة إلى بيانات العميل من جدول customers
    let sql = `SELECT s.*, c.name AS disp_customer_name, c.phone AS disp_customer_phone 
               FROM sales s LEFT JOIN customers c ON c.id = s.customer_id 
               ${where} ORDER BY s.id DESC`;
    const finalParams = [...params];
    if (limit > 0) {
      sql += ' LIMIT ? OFFSET ?';
      finalParams.push(limit, offset);
    }
    const [rows] = await conn.query(sql, finalParams);
    
    return { 
      ok: true, 
      items: rows, 
      total,
      count: rows.length,
      limit: limit || total,
      offset 
    };
  });
}

async function fetchCreditInvoices(query) {
  return withConnection(async (conn) => {
    const settledOnly = (query.settled_only === 'true' || query.settled_only === true);
    const clauses = ["s.doc_type='invoice'"];
    const params = [];
    
    if(settledOnly){
      clauses.push("s.payment_status='paid'");
      clauses.push("s.settled_method IS NOT NULL");
    } else {
      clauses.push("s.payment_method='credit'");
      clauses.push("s.payment_status='unpaid'");
    }
    
    if (query.q) {
      const keyword = `%${query.q.trim()}%`;
      clauses.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ?)');
      params.push(keyword, keyword, keyword, keyword);
    }
    
    if (query.customer_q) {
      const keyword = `%${query.customer_q.trim()}%`;
      clauses.push('(s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR s.customer_name LIKE ?)');
      params.push(keyword, keyword, keyword);
    }
    
    const normFrom = query.date_from && /^\d{4}-\d{2}-\d{2}$/.test(query.date_from) ? (query.date_from + ' 00:00:00') : query.date_from;
    const normTo = query.date_to && /^\d{4}-\d{2}-\d{2}$/.test(query.date_to) ? (query.date_to + ' 23:59:59') : query.date_to;
    
    if(settledOnly){
      if(normFrom){ clauses.push('s.settled_at >= ?'); params.push(normFrom); }
      if(normTo){ clauses.push('s.settled_at <= ?'); params.push(normTo); }
    } else {
      if(normFrom){ clauses.push('s.created_at >= ?'); params.push(normFrom); }
      if(normTo){ clauses.push('s.created_at <= ?'); params.push(normTo); }
    }
    
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    
    const page = Math.max(1, parseInteger(query.page, 1));
    const pageSize = Math.max(1, Math.min(10000, parseInteger(query.pageSize, 50)));
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM sales s ${where}`;
    const [[countRow]] = await conn.query(countSql, params);
    const total = Number(countRow?.total || 0);
    
    let sql = `SELECT s.* FROM sales s ${where} ORDER BY s.id DESC LIMIT ? OFFSET ?`;
    const finalParams = [...params, pageSize, offset];
    const [rows] = await conn.query(sql, finalParams);
    
    return { 
      ok: true, 
      items: rows, 
      total,
      page,
      pageSize
    };
  });
}

async function fetchInvoiceDetails(id) {
  if (!id) return { ok: false, error: 'missing id' };
  return withConnection(async (conn) => {
    // استرجاع جميع حقول الفاتورة (مثل الجهاز الرئيسي) لضمان عرض كامل البيانات
    const [[invoice]] = await conn.query('SELECT * FROM sales WHERE id=? LIMIT 1', [id]);
    if (!invoice) return { ok: false, error: 'not found' };
    const [items] = await conn.query('SELECT id,product_id,name,description,price,qty,line_total FROM sales_items WHERE sale_id=? ORDER BY id ASC', [id]);
    invoice.items = items;
    return { ok: true, invoice };
  });
}

async function fetchCreditNotes(query) {
  return withConnection(async (conn) => {
    const clauses = ["(s.doc_type='credit_note' OR s.invoice_no LIKE 'CN-%')"];
    const params = [];
    
    // Check if ref_base_sale_id column exists
    let hasRef = false;
    try {
      const [cols] = await conn.query("SHOW COLUMNS FROM sales LIKE 'ref_base_sale_id'");
      hasRef = Array.isArray(cols) && cols.length > 0;
    } catch (_) { }
    
    // Free-text search
    if (query.q) {
      const keyword = `%${query.q.trim()}%`;
      if (hasRef) {
        clauses.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ? OR base.invoice_no LIKE ? OR base.customer_name LIKE ? OR base.customer_phone LIKE ? OR base.customer_vat LIKE ?)');
        params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
      } else {
        clauses.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ? OR s.customer_vat LIKE ?)');
        params.push(keyword, keyword, keyword, keyword);
      }
    }
    
    // Date filters
    if (query.date_from) {
      const normFrom = /^\d{4}-\d{2}-\d{2}$/.test(query.date_from) ? (query.date_from + ' 00:00:00') : query.date_from;
      clauses.push('s.created_at >= ?');
      params.push(normFrom);
    }
    if (query.date_to) {
      const normTo = /^\d{4}-\d{2}-\d{2}$/.test(query.date_to) ? (query.date_to + ' 23:59:59') : query.date_to;
      clauses.push('s.created_at <= ?');
      params.push(normTo);
    }
    
    const where = 'WHERE ' + clauses.join(' AND ');
    const baseSelect = hasRef 
      ? ", base.invoice_no AS base_invoice_no, base.created_at AS base_created_at, base.grand_total AS base_grand_total, base.id AS base_id" 
      : ", s.ref_base_invoice_no AS base_invoice_no, NULL AS base_created_at, NULL AS base_grand_total, NULL AS base_id";
    const join = hasRef ? 'LEFT JOIN sales base ON base.id = s.ref_base_sale_id' : '';
    const limit = query.limit ? Math.min(Math.max(1, parseInteger(query.limit, 0)), 50000) : 10000;
    const offset = Math.max(0, parseInteger(query.offset, 0));
    
    const sql = `SELECT s.* ${baseSelect} FROM sales s ${join} ${where} ORDER BY s.id DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await conn.query(sql, params);
    
    return { ok: true, items: rows };
  });
}

async function fetchInventory(query) {
  return withConnection(async (conn) => {
    const page = Math.max(1, parseInteger(query.page, 1));
    const pageSize = Math.max(1, Math.min(10000, parseInteger(query.pageSize, 100)));
    const offset = (page - 1) * pageSize;
    
    const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM inventory_items');
    
    const sql = 'SELECT id,name,unit,stock,created_at FROM inventory_items ORDER BY name ASC LIMIT ? OFFSET ?';
    const [rows] = await conn.query(sql, [pageSize, offset]);
    
    return { ok: true, items: rows, total, page, pageSize };
  });
}

async function fetchCustomers(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    if (query.q) {
      const keyword = `%${query.q.trim()}%`;
      clauses.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      params.push(keyword, keyword, keyword);
    }
    if (query.active === '0' || query.active === '1') {
      clauses.push('is_active = ?');
      params.push(Number(query.active));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    
    const page = Math.max(1, parseInteger(query.page, 1));
    const pageSize = Math.max(1, Math.min(10000, parseInteger(query.pageSize, 20)));
    const offset = (page - 1) * pageSize;
    
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) as total FROM customers ${where}`, params);
    
    const sql = `SELECT id,name,phone,email,address,vat_number,cr_number,national_address,notes,is_active,created_at FROM customers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const finalParams = [...params, pageSize, offset];
    
    const [rows] = await conn.query(sql, finalParams);
    return { ok: true, items: rows, total, page, pageSize };
  });
}

async function fetchCustomerById(id) {
  if (!id) return { ok: false, error: 'missing id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id,name,phone,email,address,vat_number,cr_number,national_address,notes,is_active,created_at FROM customers WHERE id=? LIMIT 1', [id]);
    if (!rows.length) return { ok: false, error: 'not found' };
    return { ok: true, item: rows[0] };
  });
}

async function fetchDrivers(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    if (query.q) {
      const keyword = `%${query.q.trim()}%`;
      clauses.push('(name LIKE ? OR phone LIKE ?)');
      params.push(keyword, keyword);
    }
    if (query.active === '1') {
      clauses.push('active = 1');
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    
    const page = Math.max(1, parseInteger(query.page, 1));
    const pageSize = Math.max(1, Math.min(10000, parseInteger(query.pageSize, 100)));
    const offset = (page - 1) * pageSize;
    
    const [[{ total }]] = await conn.query(`SELECT COUNT(*) as total FROM drivers ${where}`, params);
    
    const sql = `SELECT id,name,phone,active,created_at FROM drivers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const finalParams = [...params, pageSize, offset];
    
    const [rows] = await conn.query(sql, finalParams);
    return { ok: true, items: rows, total, page, pageSize };
  });
}

async function fetchDriverById(id) {
  if (!id) return { ok: false, error: 'missing id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM drivers WHERE id=? LIMIT 1', [id]);
    if (!rows.length) return { ok: false, error: 'not found' };
    return { ok: true, item: rows[0] };
  });
}

async function fetchRooms(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    if (query.section) {
      clauses.push('section = ?');
      params.push(query.section);
    }
    if (query.status) {
      clauses.push('status = ?');
      params.push(query.status);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    let sql = `SELECT id,name,section,capacity,status,waiter,opened_at,created_at FROM rooms ${where} ORDER BY section ASC, id ASC`;
    const [rows] = await conn.query(sql, params);
    return { ok: true, items: rows };
  });
}

async function fetchRoomSession(room_id) {
  if (!room_id) return { ok: false, error: 'missing room_id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM room_sessions WHERE room_id=? LIMIT 1', [room_id]);
    return { ok: true, session: rows.length ? rows[0] : null };
  });
}

async function fetchOperations() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id,name,sort_order,is_active,created_at FROM operations ORDER BY sort_order ASC, is_active DESC, name ASC');
    return { ok: true, items: rows };
  });
}

async function fetchProductOperations(product_id) {
  if (!product_id) return { ok: false, error: 'missing product_id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query(`
      SELECT po.operation_id, po.price, o.name, o.is_active, o.sort_order
      FROM product_operations po
      JOIN operations o ON o.id = po.operation_id
      WHERE po.product_id = ?
      ORDER BY o.sort_order ASC, o.name ASC
    `, [product_id]);
    return { ok: true, items: rows };
  });
}

async function fetchTypes() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id,name,sort_order,is_active,created_at FROM main_types WHERE is_active=1 ORDER BY sort_order ASC, name ASC');
    return { ok: true, items: rows };
  });
}

async function fetchTypesAll() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM main_types ORDER BY sort_order ASC, name ASC');
    return { ok: true, items: rows };
  });
}

async function fetchTypeById(id) {
  if (!id) return { ok: false, error: 'missing id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM main_types WHERE id=? LIMIT 1', [id]);
    if (!rows.length) return { ok: false, error: 'not found' };
    return { ok: true, item: rows[0] };
  });
}

async function fetchCategories() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
    return { ok: true, items: rows.map(r => r.category) };
  });
}

async function fetchOffers(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    if (query.q) {
      const keyword = `%${query.q.trim()}%`;
      clauses.push('(name LIKE ? OR description LIKE ?)');
      params.push(keyword, keyword);
    }
    if (query.active === '0' || query.active === '1') {
      clauses.push('is_active = ?');
      params.push(Number(query.active));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Math.max(0, parseInteger(query.limit, 500));
    const offset = Math.max(0, parseInteger(query.offset, 0));
    let sql = `SELECT id,name,description,mode,value,start_date,end_date,is_global,is_active,created_at FROM offers ${where} ORDER BY id DESC`;
    const finalParams = [...params];
    if (limit > 0) {
      sql += ' LIMIT ? OFFSET ?';
      finalParams.push(limit, offset);
    }
    const [rows] = await conn.query(sql, finalParams);
    return { ok: true, items: rows };
  });
}

async function fetchOfferProducts(offer_id) {
  if (!offer_id) return { ok: false, error: 'missing offer_id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query(`
      SELECT op.product_id, op.operation_id, p.name AS product_name, o.name AS operation_name
      FROM offer_products op
      LEFT JOIN products p ON p.id = op.product_id
      LEFT JOIN operations o ON o.id = op.operation_id
      WHERE op.offer_id = ?
      ORDER BY op.id ASC
    `, [offer_id]);
    return { ok: true, items: rows };
  });
}

async function fetchCustomerPricing(customer_id) {
  if (!customer_id) return { ok: false, error: 'missing customer_id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query(`
      SELECT cp.*, p.name AS product_name, p.barcode AS product_barcode, o.name AS operation_name
      FROM customer_pricing cp
      LEFT JOIN products p ON p.id = cp.product_id
      LEFT JOIN operations o ON o.id = cp.operation_id
      WHERE cp.customer_id = ?
      ORDER BY cp.id DESC
    `, [customer_id]);
    return { ok: true, items: rows };
  });
}

async function fetchCustomerPricingList(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    if (query.customer_id) {
      clauses.push('cp.customer_id = ?');
      params.push(Number(query.customer_id));
    }
    if (query.product_id) {
      clauses.push('cp.product_id = ?');
      params.push(Number(query.product_id));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await conn.query(`
      SELECT cp.*, c.name AS customer_name, c.phone AS customer_phone, p.name AS product_name, p.barcode AS product_barcode, o.name AS operation_name
      FROM customer_pricing cp
      LEFT JOIN customers c ON c.id = cp.customer_id
      LEFT JOIN products p ON p.id = cp.product_id
      LEFT JOIN operations o ON o.id = cp.operation_id
      ${where}
      ORDER BY cp.id DESC
      LIMIT 500
    `, params);
    return { ok: true, items: rows };
  });
}

async function fetchInventoryItems(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    if (query.active === '0' || query.active === '1') {
      clauses.push('is_active = ?');
      params.push(Number(query.active));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await conn.query(`SELECT * FROM inventory_items ${where} ORDER BY name ASC`, params);
    return { ok: true, items: rows };
  });
}

async function fetchPurchasesList(query) {
  return withConnection(async (conn) => {
    const clauses = [];
    const params = [];
    // دعم فلترة دقيقة بالزمن إذا توفرت from_at/to_at، وإلا نرجع للتاريخ فقط
    if (query.from_at || query.to_at) {
      if (query.from_at) {
        clauses.push('COALESCE(purchase_at, created_at) >= ?');
        params.push(query.from_at);
      }
      if (query.to_at) {
        clauses.push('COALESCE(purchase_at, created_at) <= ?');
        params.push(query.to_at);
      }
    } else if (query.from_date || query.to_date) {
      if (query.from_date && query.to_date) {
        clauses.push('purchase_date BETWEEN ? AND ?');
        params.push(query.from_date, query.to_date);
      } else if (query.from_date) {
        clauses.push('purchase_date >= ?');
        params.push(query.from_date);
      } else if (query.to_date) {
        clauses.push('purchase_date <= ?');
        params.push(query.to_date);
      }
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await conn.query(`SELECT * FROM purchases ${where} ORDER BY COALESCE(purchase_at, created_at) DESC, id DESC`, params);
    return { ok: true, items: rows };
  });
}

async function fetchUsersList() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id DESC');
    return { ok: true, items: rows };
  });
}

async function fetchUserById(id) {
  if (!id) return { ok: false, error: 'missing id' };
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT id, username, full_name, role, is_active FROM users WHERE id=? LIMIT 1', [id]);
    if (!rows.length) return { ok: false, error: 'not found' };
    return { ok: true, item: rows[0] };
  });
}

async function fetchPermissionsList() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query('SELECT perm_key, name FROM permissions ORDER BY name ASC');
    return { ok: true, items: rows };
  });
}

async function fetchUserPermissions(user_id) {
  if (!user_id) return { ok: false, error: 'missing user_id' };
  return withConnection(async (conn) => {
    const [uRows] = await conn.query('SELECT role FROM users WHERE id=? LIMIT 1', [user_id]);
    if (!uRows.length) return { ok: false, error: 'user not found' };
    const role = uRows[0].role;
    if (role === 'admin' || role === 'super') {
      const [allPerms] = await conn.query('SELECT perm_key FROM permissions');
      return { ok: true, keys: allPerms.map(r => r.perm_key) };
    }
    const [rows] = await conn.query('SELECT perm_key FROM user_permissions WHERE user_id=?', [user_id]);
    return { ok: true, keys: rows.map(r => r.perm_key) };
  });
}

async function fetchSettings() {
  return withConnection(async (conn) => {
    const [[row]] = await conn.query('SELECT * FROM app_settings WHERE id=1 LIMIT 1');
    if (!row) return { ok: false, error: 'settings not found' };
    return { ok: true, settings: row };
  });
}

async function ensureInvoiceCounter(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS app_counters (name VARCHAR(64) PRIMARY KEY, value INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await conn.query(`INSERT IGNORE INTO app_counters (name, value) VALUES ('invoice_seq', 0)`);
  await conn.query(`UPDATE app_counters SET value = value + 1 WHERE name='invoice_seq'`);
  const [[row]] = await conn.query(`SELECT value FROM app_counters WHERE name='invoice_seq'`);
  return Number(row?.value || 1);
}

function paymentStatusForMethod(method) {
  return String(method || '').toLowerCase() === 'credit' ? 'unpaid' : 'paid';
}

async function createInvoice(payload) {
  if (!payload || !Array.isArray(payload.items) || !payload.items.length) {
    return { ok: false, error: 'items required' };
  }
  if (!payload.payment_method) {
    return { ok: false, error: 'payment_method required' };
  }
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      const seq = await ensureInvoiceCounter(conn);
      const invoiceNumber = String(seq);
      const [res] = await conn.query(
        'INSERT INTO sales (invoice_no,payment_method,payment_status,sub_total,vat_total,grand_total,customer_id,customer_name,notes) VALUES (?,?,?,?,?,?,?,?,?)',
        [
          invoiceNumber,
          payload.payment_method,
          paymentStatusForMethod(payload.payment_method),
          Number(payload.sub_total || 0),
          Number(payload.vat_total || 0),
          Number(payload.grand_total || 0),
          payload.customer_id || null,
          payload.customer_name || null,
          payload.notes || null,
        ]
      );
      const saleId = res.insertId;
      const items = payload.items.map((item) => [
        saleId,
        Number(item.product_id) || null,
        item.name || null,
        item.description || null,
        Number(item.price || 0),
        Math.max(1, Number(item.qty || 1)),
        Number(item.line_total || 0),
      ]);
      if (items.length) {
        await conn.query('INSERT INTO sales_items (sale_id,product_id,name,description,price,qty,line_total) VALUES ?', [items]);
      }
      for (const item of payload.items) {
        const productId = Number(item.product_id);
        const qty = Math.max(1, Number(item.qty || 1));
        if (productId > 0) {
          await conn.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id=?', [qty, productId]);
        }
      }
      await conn.commit();
      return { ok: true, invoice_no: invoiceNumber, sale_id: saleId };
    } catch (error) {
      await conn.rollback();
      console.error('api:createInvoice', error);
      return { ok: false, error: 'failed to create invoice' };
    }
  });
}

// Permissions middleware
async function checkPermission(requiredPerm) {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ ok: false, error: 'Unauthorized - missing user ID' });
      }

      const result = await withConnection(async (conn) => {
        const [[user]] = await conn.query('SELECT role FROM users WHERE id=? LIMIT 1', [userId]);
        if (!user) return { ok: false };
        
        // Admin and super have all permissions
        if (user.role === 'admin' || user.role === 'super') {
          return { ok: true };
        }
        
        // Check specific permission
        const [perms] = await conn.query('SELECT perm_key FROM user_permissions WHERE user_id=? AND perm_key=?', [userId, requiredPerm]);
        return { ok: perms.length > 0 };
      });

      if (!result.ok) {
        return res.status(403).json({ ok: false, error: 'Forbidden - insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ ok: false, error: 'Permission check failed' });
    }
  };
}

function createApiRouter() {
  const router = express.Router();

  router.get('/products', async (req, res) => {
    try {
      const data = await fetchProducts(req.query);
      const compressed = await compressApiResponse(data);
      return res.json(compressed);
    } catch (error) {
      console.error('api:products', error);
      return res.status(500).json({ ok: false, error: 'failed to load products' });
    }
  });

  router.get('/products/:id', async (req, res) => {
    try {
      const data = await fetchProductById(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:product', error);
      return res.status(500).json({ ok: false, error: 'failed to load product' });
    }
  });

  router.get('/products/barcode/:code', async (req, res) => {
    try {
      const data = await fetchProductByBarcode(req.params.code);
      return res.json(data);
    } catch (error) {
      console.error('api:product_barcode', error);
      return res.status(500).json({ ok: false, error: 'failed to load product' });
    }
  });

  router.get('/products-images-batch', async (req, res) => {
    try {
      const idsParam = req.query.ids || '';
      const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      
      if (!ids.length) return res.json({ ok: true, items: {} });
      
      const result = await withConnection(async (conn) => {
        const placeholders = ids.map(() => '?').join(',');
        const [rows] = await conn.query(
          `SELECT id, image_blob, image_mime, image_path FROM products WHERE id IN (${placeholders})`,
          ids
        );
        
        const items = {};
        const fs = require('fs').promises;
        const path = require('path');
        const { optimizeProductImage } = require('./image-optimizer');
        
        await Promise.all(rows.map(async (row) => {
          try {
            let imageBuffer = null;
            let mime = 'image/png';
            
            if (row.image_blob) {
              imageBuffer = Buffer.from(row.image_blob);
              mime = row.image_mime || 'image/png';
            } else if (row.image_path) {
              let absPath = row.image_path;
              if (/^assets\//.test(row.image_path)) {
                absPath = getResourcePath(row.image_path);
              }
              imageBuffer = await fs.readFile(absPath);
              const ext = String(path.extname(absPath)).toLowerCase();
              mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
            }
            
            if (imageBuffer) {
              const optimized = await optimizeProductImage(imageBuffer, mime);
              if (optimized) {
                items[row.id] = optimized;
              }
            }
          } catch (err) {
            console.error(`Error loading image for product ${row.id}:`, err.message);
          }
        }));
        
        return { ok: true, items };
      });
      
      return res.json(result);
    } catch (error) {
      console.error('api:products-images-batch', error);
      return res.status(500).json({ ok: false, error: 'failed to load images' });
    }
  });

  router.get('/products-ops-batch', async (req, res) => {
    try {
      const idsParam = req.query.ids || '';
      const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      
      if (!ids.length) return res.json({ ok: true, items: {} });
      
      const result = await withConnection(async (conn) => {
        const placeholders = ids.map(() => '?').join(',');
        const sql = `
          SELECT po.product_id, po.operation_id, po.price, o.name, o.is_active, o.id as op_real_id
          FROM product_operations po
          JOIN operations o ON po.operation_id = o.id
          WHERE po.product_id IN (${placeholders})
        `;
        const [rows] = await conn.query(sql, ids);
        
        const items = {};
        ids.forEach(id => items[id] = []);
        
        rows.forEach(row => {
          if (!items[row.product_id]) items[row.product_id] = [];
          items[row.product_id].push({
            operation_id: row.operation_id,
            id: row.op_real_id,
            name: row.name,
            price: row.price,
            is_active: row.is_active
          });
        });
        
        return { ok: true, items };
      });
      
      return res.json(result);
    } catch (error) {
      console.error('api:products-ops-batch', error);
      return res.status(500).json({ ok: false, error: 'failed to load operations' });
    }
  });

  router.get('/invoices', async (req, res) => {
    try {
      const data = await fetchInvoices(req.query);
      const compressed = await compressApiResponse(data);
      return res.json(compressed);
    } catch (error) {
      console.error('api:invoices', error);
      return res.status(500).json({ ok: false, error: 'failed to load invoices' });
    }
  });

  router.get('/invoices/:id', async (req, res) => {
    try {
      const data = await fetchInvoiceDetails(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:invoice', error);
      return res.status(500).json({ ok: false, error: 'failed to load invoice' });
    }
  });

  // Sales print data - optimized single call for secondary devices
  router.get('/sales/:id/print-data', async (req, res) => {
    try {
      const saleId = req.params.id;
      const roomId = req.query.roomId;
      
      if (!saleId) {
        return res.status(400).json({ ok: false, error: 'missing id' });
      }

      const data = await withConnection(async (conn) => {
        const [
          saleRows,
          [items],
          [[settings]]
        ] = await Promise.all([
          conn.query(`
            SELECT 
              s.*,
              c.id as cust_id, c.name as cust_name, c.phone as cust_phone, 
              c.address as cust_address, c.vat_number as cust_vat_number, c.email as cust_email,
              c.cr_number as cust_cr_number, c.national_address as cust_national_address,
              d.id as drv_id, d.name as drv_name, d.phone as drv_phone,
              u.id as usr_id, u.username as usr_username, u.full_name as usr_full_name,
              r.id as rm_id, r.name as rm_name, r.section as rm_section
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN users u ON u.id = s.created_by_user_id
            LEFT JOIN rooms r ON r.id = ?
            WHERE s.id = ?
            LIMIT 1
          `, [roomId || null, saleId]),
          conn.query(
            'SELECT si.*, p.is_tobacco, p.category FROM sales_items si LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id=?',
            [saleId]
          ),
          conn.query('SELECT * FROM app_settings WHERE id=1 LIMIT 1')
        ]);

        const sale = (saleRows && saleRows[0]) ? saleRows[0][0] : null;
        if (!sale) {
          return { ok: false, error: 'الفاتورة غير موجودة' };
        }

        let logo = null;
        if (settings && settings.logo_blob) {
          logo = {
            base64: settings.logo_blob.toString('base64'),
            mime: settings.logo_mime || 'image/png'
          };
        }

        let customer = null;
        if (sale.cust_id) {
          customer = {
            id: sale.cust_id,
            name: sale.cust_name,
            phone: sale.cust_phone,
            address: sale.cust_address,
            vat_number: sale.cust_vat_number,
            email: sale.cust_email,
            cr_number: sale.cust_cr_number,
            national_address: sale.cust_national_address
          };
          delete sale.cust_id;
          delete sale.cust_name;
          delete sale.cust_phone;
          delete sale.cust_address;
          delete sale.cust_vat_number;
          delete sale.cust_email;
          delete sale.cust_cr_number;
          delete sale.cust_national_address;
        }

        let driver = null;
        if (sale.drv_id) {
          driver = {
            id: sale.drv_id,
            name: sale.drv_name,
            phone: sale.drv_phone
          };
          delete sale.drv_id;
          delete sale.drv_name;
          delete sale.drv_phone;
        }

        let user = null;
        if (sale.usr_id) {
          user = {
            id: sale.usr_id,
            username: sale.usr_username,
            full_name: sale.usr_full_name
          };
          delete sale.usr_id;
          delete sale.usr_username;
          delete sale.usr_full_name;
        }

        let room = null;
        if (sale.rm_id) {
          room = {
            id: sale.rm_id,
            name: sale.rm_name,
            section: sale.rm_section
          };
          delete sale.rm_id;
          delete sale.rm_name;
          delete sale.rm_section;
        }

        return {
          ok: true,
          sale,
          items,
          settings: settings || {},
          logo,
          customer,
          driver,
          user,
          room
        };
      });

      return res.json(data);
    } catch (error) {
      console.error('api:sales:print-data', error);
      return res.status(500).json({ ok: false, error: 'failed to fetch print data' });
    }
  });

  router.get('/credit-invoices', async (req, res) => {
    try {
      const data = await fetchCreditInvoices(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:credit-invoices', error);
      return res.status(500).json({ ok: false, error: 'failed to load credit invoices' });
    }
  });

  // Credit notes (إشعارات دائنة)
  router.get('/credit-notes', async (req, res) => {
    try {
      const data = await fetchCreditNotes(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:credit-notes', error);
      return res.status(500).json({ ok: false, error: 'failed to load credit notes' });
    }
  });

  router.get('/stock', async (req, res) => {
    try {
      const data = await fetchInventory(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:stock', error);
      return res.status(500).json({ ok: false, error: 'failed to load stock' });
    }
  });

  router.post('/invoices', async (req, res) => {
    try {
      const data = await createInvoice(req.body);
      if (!data.ok) {
        return res.status(400).json(data);
      }
      return res.json(data);
    } catch (error) {
      console.error('api:createInvoice', error);
      return res.status(500).json({ ok: false, error: 'failed to create invoice' });
    }
  });

  router.get('/customers', async (req, res) => {
    try {
      const data = await fetchCustomers(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:customers', error);
      return res.status(500).json({ ok: false, error: 'failed to load customers' });
    }
  });

  router.get('/customers/:id', async (req, res) => {
    try {
      const data = await fetchCustomerById(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:customer', error);
      return res.status(500).json({ ok: false, error: 'failed to load customer' });
    }
  });

  router.get('/drivers', async (req, res) => {
    try {
      const data = await fetchDrivers(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:drivers', error);
      return res.status(500).json({ ok: false, error: 'failed to load drivers' });
    }
  });

  router.get('/drivers/:id', async (req, res) => {
    try {
      const data = await fetchDriverById(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:driver', error);
      return res.status(500).json({ ok: false, error: 'failed to load driver' });
    }
  });

  router.get('/rooms', async (req, res) => {
    try {
      const data = await fetchRooms(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:rooms', error);
      return res.status(500).json({ ok: false, error: 'failed to load rooms' });
    }
  });

  router.get('/rooms/:id/session', async (req, res) => {
    try {
      const data = await fetchRoomSession(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:room_session', error);
      return res.status(500).json({ ok: false, error: 'failed to load room session' });
    }
  });

  router.get('/operations', async (req, res) => {
    try {
      const data = await fetchOperations();
      return res.json(data);
    } catch (error) {
      console.error('api:operations', error);
      return res.status(500).json({ ok: false, error: 'failed to load operations' });
    }
  });

  router.get('/operations/product/:id', async (req, res) => {
    try {
      const data = await fetchProductOperations(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:product_operations', error);
      return res.status(500).json({ ok: false, error: 'failed to load product operations' });
    }
  });

  router.get('/types', async (req, res) => {
    try {
      const data = await fetchTypes();
      return res.json(data);
    } catch (error) {
      console.error('api:types', error);
      return res.status(500).json({ ok: false, error: 'failed to load types' });
    }
  });

  router.get('/types/all', async (req, res) => {
    try {
      const data = await fetchTypesAll();
      return res.json(data);
    } catch (error) {
      console.error('api:types_all', error);
      return res.status(500).json({ ok: false, error: 'failed to load types' });
    }
  });

  router.get('/types/:id', async (req, res) => {
    try {
      const data = await fetchTypeById(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:type', error);
      return res.status(500).json({ ok: false, error: 'failed to load type' });
    }
  });

  router.get('/categories', async (req, res) => {
    try {
      const data = await fetchCategories();
      return res.json(data);
    } catch (error) {
      console.error('api:categories', error);
      return res.status(500).json({ ok: false, error: 'failed to load categories' });
    }
  });

  router.get('/offers', async (req, res) => {
    try {
      const data = await fetchOffers(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:offers', error);
      return res.status(500).json({ ok: false, error: 'failed to load offers' });
    }
  });

  router.get('/offers/:id/products', async (req, res) => {
    try {
      const data = await fetchOfferProducts(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:offer_products', error);
      return res.status(500).json({ ok: false, error: 'failed to load offer products' });
    }
  });

  router.get('/customer_pricing', async (req, res) => {
    try {
      const data = await fetchCustomerPricingList(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:customer_pricing_list', error);
      return res.status(500).json({ ok: false, error: 'failed to load customer pricing' });
    }
  });

  router.get('/customer_pricing/:customer_id', async (req, res) => {
    try {
      const data = await fetchCustomerPricing(req.params.customer_id);
      return res.json(data);
    } catch (error) {
      console.error('api:customer_pricing', error);
      return res.status(500).json({ ok: false, error: 'failed to load customer pricing' });
    }
  });

  router.get('/inventory', async (req, res) => {
    try {
      const data = await fetchInventoryItems(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:inventory', error);
      return res.status(500).json({ ok: false, error: 'failed to load inventory' });
    }
  });

  router.get('/purchases', async (req, res) => {
    try {
      const data = await fetchPurchasesList(req.query);
      return res.json(data);
    } catch (error) {
      console.error('api:purchases', error);
      return res.status(500).json({ ok: false, error: 'failed to load purchases' });
    }
  });

  router.get('/users', async (req, res) => {
    try {
      const data = await fetchUsersList();
      return res.json(data);
    } catch (error) {
      console.error('api:users', error);
      return res.status(500).json({ ok: false, error: 'failed to load users' });
    }
  });

  router.get('/users/:id', async (req, res) => {
    try {
      const data = await fetchUserById(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:user', error);
      return res.status(500).json({ ok: false, error: 'failed to load user' });
    }
  });

  router.get('/permissions', async (req, res) => {
    try {
      const data = await fetchPermissionsList();
      return res.json(data);
    } catch (error) {
      console.error('api:permissions', error);
      return res.status(500).json({ ok: false, error: 'failed to load permissions' });
    }
  });

  router.get('/permissions/user/:id', async (req, res) => {
    try {
      const data = await fetchUserPermissions(req.params.id);
      return res.json(data);
    } catch (error) {
      console.error('api:user_permissions', error);
      return res.status(500).json({ ok: false, error: 'failed to load user permissions' });
    }
  });

  router.get('/settings', async (req, res) => {
    try {
      const data = await fetchSettings();
      return res.json(data);
    } catch (error) {
      console.error('api:settings', error);
      return res.status(500).json({ ok: false, error: 'failed to load settings' });
    }
  });

  // ==================== POST/PUT/DELETE ENDPOINTS ====================
  
  // Products - Create/Update/Delete
  router.post('/products', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, name_en, barcode, price, stock, category, description, image_blob, image_mime, is_tobacco, is_active, sort_order } = req.body;
        const [result] = await conn.query(
          `INSERT INTO products (name, name_en, barcode, price, stock, category, description, image_blob, image_mime, is_tobacco, is_active, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, name_en || null, barcode || null, Number(price || 0), Number(stock || 0), category || null, description || null, 
           image_blob ? Buffer.from(image_blob, 'base64') : null, image_mime || null, is_tobacco ? 1 : 0, is_active !== 0 ? 1 : 0, Number(sort_order || 0)]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:products:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create product' });
    }
  });

  router.put('/products/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, name_en, barcode, price, stock, category, description, image_blob, image_mime, is_tobacco, is_active, sort_order } = req.body;
        await conn.query(
          `UPDATE products SET name=?, name_en=?, barcode=?, price=?, stock=?, category=?, description=?, 
           image_blob=?, image_mime=?, is_tobacco=?, is_active=?, sort_order=? WHERE id=?`,
          [name, name_en || null, barcode || null, Number(price || 0), Number(stock || 0), category || null, description || null,
           image_blob ? Buffer.from(image_blob, 'base64') : null, image_mime || null, is_tobacco ? 1 : 0, is_active !== 0 ? 1 : 0, Number(sort_order || 0), req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:products:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update product' });
    }
  });

  router.delete('/products/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM products WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:products:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete product' });
    }
  });

  // Customers - Create/Update/Delete
  router.post('/customers', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, phone, email, address, vat_number, cr_number, national_address, notes, is_active } = req.body;
        const [result] = await conn.query(
          `INSERT INTO customers (name, phone, email, address, vat_number, cr_number, national_address, notes, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, phone || null, email || null, address || null, vat_number || null, cr_number || null, national_address || null, notes || null, is_active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:customers:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create customer' });
    }
  });

  router.put('/customers/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, phone, email, address, vat_number, cr_number, national_address, notes, is_active } = req.body;
        await conn.query(
          `UPDATE customers SET name=?, phone=?, email=?, address=?, vat_number=?, cr_number=?, national_address=?, notes=?, is_active=? WHERE id=?`,
          [name, phone || null, email || null, address || null, vat_number || null, cr_number || null, national_address || null, notes || null, is_active !== 0 ? 1 : 0, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:customers:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update customer' });
    }
  });

  router.delete('/customers/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM customers WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:customers:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete customer' });
    }
  });

  // Drivers - Create/Update/Delete
  router.post('/drivers', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, phone, active } = req.body;
        const [result] = await conn.query(
          `INSERT INTO drivers (name, phone, active) VALUES (?, ?, ?)`,
          [name, phone || null, active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:drivers:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create driver' });
    }
  });

  router.put('/drivers/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, phone, active } = req.body;
        await conn.query(
          `UPDATE drivers SET name=?, phone=?, active=? WHERE id=?`,
          [name, phone || null, active !== 0 ? 1 : 0, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:drivers:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update driver' });
    }
  });

  router.delete('/drivers/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM drivers WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:drivers:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete driver' });
    }
  });

  // Operations - Create/Update/Delete
  router.post('/operations', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, sort_order, is_active } = req.body;
        const [result] = await conn.query(
          `INSERT INTO operations (name, sort_order, is_active) VALUES (?, ?, ?)`,
          [name, Number(sort_order || 0), is_active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:operations:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create operation' });
    }
  });

  router.put('/operations/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, sort_order, is_active } = req.body;
        await conn.query(
          `UPDATE operations SET name=?, sort_order=?, is_active=? WHERE id=?`,
          [name, Number(sort_order || 0), is_active !== 0 ? 1 : 0, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:operations:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update operation' });
    }
  });

  router.delete('/operations/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM operations WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:operations:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete operation' });
    }
  });

  // Types - Create/Update/Delete
  router.post('/types', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, sort_order, is_active } = req.body;
        const [result] = await conn.query(
          `INSERT INTO main_types (name, sort_order, is_active) VALUES (?, ?, ?)`,
          [name, Number(sort_order || 0), is_active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:types:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create type' });
    }
  });

  router.put('/types/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, sort_order, is_active } = req.body;
        await conn.query(
          `UPDATE main_types SET name=?, sort_order=?, is_active=? WHERE id=?`,
          [name, Number(sort_order || 0), is_active !== 0 ? 1 : 0, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:types:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update type' });
    }
  });

  router.delete('/types/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM main_types WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:types:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete type' });
    }
  });

  // Rooms - Create/Update/Delete
  router.post('/rooms', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, section, capacity, status, waiter } = req.body;
        const [result] = await conn.query(
          `INSERT INTO rooms (name, section, capacity, status, waiter) VALUES (?, ?, ?, ?, ?)`,
          [name, section || null, Number(capacity || 0), status || 'available', waiter || null]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:rooms:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create room' });
    }
  });

  router.put('/rooms/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, section, capacity, status, waiter } = req.body;
        await conn.query(
          `UPDATE rooms SET name=?, section=?, capacity=?, status=?, waiter=? WHERE id=?`,
          [name, section || null, Number(capacity || 0), status || 'available', waiter || null, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:rooms:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update room' });
    }
  });

  router.delete('/rooms/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM rooms WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:rooms:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete room' });
    }
  });

  // Users - Create/Update/Delete
  router.post('/users', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { username, password, full_name, role, is_active } = req.body;
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await conn.query(
          `INSERT INTO users (username, password, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)`,
          [username, hashedPassword, full_name || null, role || 'cashier', is_active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:users:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create user' });
    }
  });

  router.put('/users/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { username, password, full_name, role, is_active } = req.body;
        if (password) {
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(password, 10);
          await conn.query(
            `UPDATE users SET username=?, password=?, full_name=?, role=?, is_active=? WHERE id=?`,
            [username, hashedPassword, full_name || null, role || 'cashier', is_active !== 0 ? 1 : 0, req.params.id]
          );
        } else {
          await conn.query(
            `UPDATE users SET username=?, full_name=?, role=?, is_active=? WHERE id=?`,
            [username, full_name || null, role || 'cashier', is_active !== 0 ? 1 : 0, req.params.id]
          );
        }
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:users:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update user' });
    }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM users WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:users:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete user' });
    }
  });

  // Settings - Update
  router.put('/settings', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const updates = [];
        const values = [];
        for (const [key, value] of Object.entries(req.body)) {
          updates.push(`${key}=?`);
          values.push(value);
        }
        if (updates.length === 0) {
          return { ok: false, error: 'no fields to update' };
        }
        await conn.query(`UPDATE app_settings SET ${updates.join(', ')} WHERE id=1`, values);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:settings:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update settings' });
    }
  });

  // Inventory - Create/Update/Delete
  router.post('/inventory', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, unit, stock, is_active } = req.body;
        const [result] = await conn.query(
          `INSERT INTO inventory_items (name, unit, stock, is_active) VALUES (?, ?, ?, ?)`,
          [name, unit || null, Number(stock || 0), is_active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:inventory:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create inventory item' });
    }
  });

  router.put('/inventory/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, unit, stock, is_active } = req.body;
        await conn.query(
          `UPDATE inventory_items SET name=?, unit=?, stock=?, is_active=? WHERE id=?`,
          [name, unit || null, Number(stock || 0), is_active !== 0 ? 1 : 0, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:inventory:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update inventory item' });
    }
  });

  router.delete('/inventory/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM inventory_items WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:inventory:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete inventory item' });
    }
  });

  // Purchases - Create/Update/Delete
  router.post('/purchases', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { supplier_name, purchase_date, total_amount, notes, items } = req.body;
        const [result] = await conn.query(
          `INSERT INTO purchases (supplier_name, purchase_date, total_amount, notes) VALUES (?, ?, ?, ?)`,
          [supplier_name || null, purchase_date || null, Number(total_amount || 0), notes || null]
        );
        const purchaseId = result.insertId;
        
        if (items && Array.isArray(items) && items.length > 0) {
          const itemValues = items.map(item => [
            purchaseId,
            Number(item.inventory_item_id) || null,
            item.item_name || null,
            Number(item.quantity || 0),
            Number(item.unit_price || 0),
            Number(item.total_price || 0)
          ]);
          await conn.query(
            `INSERT INTO purchase_items (purchase_id, inventory_item_id, item_name, quantity, unit_price, total_price) VALUES ?`,
            [itemValues]
          );
        }
        
        return { ok: true, id: purchaseId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:purchases:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create purchase' });
    }
  });

  router.put('/purchases/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { supplier_name, purchase_date, total_amount, notes } = req.body;
        await conn.query(
          `UPDATE purchases SET supplier_name=?, purchase_date=?, total_amount=?, notes=? WHERE id=?`,
          [supplier_name || null, purchase_date || null, Number(total_amount || 0), notes || null, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:purchases:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update purchase' });
    }
  });

  router.delete('/purchases/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM purchase_items WHERE purchase_id=?', [req.params.id]);
        await conn.query('DELETE FROM purchases WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:purchases:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete purchase' });
    }
  });

  // Offers - Create/Update/Delete
  router.post('/offers', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, description, mode, value, start_date, end_date, is_global, is_active } = req.body;
        const [result] = await conn.query(
          `INSERT INTO offers (name, description, mode, value, start_date, end_date, is_global, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, description || null, mode || 'percent', Number(value || 0), start_date || null, end_date || null, is_global ? 1 : 0, is_active !== 0 ? 1 : 0]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:offers:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create offer' });
    }
  });

  router.put('/offers/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { name, description, mode, value, start_date, end_date, is_global, is_active } = req.body;
        await conn.query(
          `UPDATE offers SET name=?, description=?, mode=?, value=?, start_date=?, end_date=?, is_global=?, is_active=? WHERE id=?`,
          [name, description || null, mode || 'percent', Number(value || 0), start_date || null, end_date || null, is_global ? 1 : 0, is_active !== 0 ? 1 : 0, req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:offers:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update offer' });
    }
  });

  router.delete('/offers/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM offer_products WHERE offer_id=?', [req.params.id]);
        await conn.query('DELETE FROM offers WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:offers:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete offer' });
    }
  });

  // Customer Pricing - Create/Update/Delete
  router.post('/customer_pricing', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { customer_id, product_id, operation_id, mode, value } = req.body;
        const [result] = await conn.query(
          `INSERT INTO customer_pricing (customer_id, product_id, operation_id, mode, value) VALUES (?, ?, ?, ?, ?)`,
          [Number(customer_id), Number(product_id), operation_id ? Number(operation_id) : null, mode || 'price', Number(value || 0)]
        );
        return { ok: true, id: result.insertId };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:customer_pricing:create', error);
      return res.status(500).json({ ok: false, error: 'failed to create customer pricing' });
    }
  });

  router.put('/customer_pricing/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        const { customer_id, product_id, operation_id, mode, value } = req.body;
        await conn.query(
          `UPDATE customer_pricing SET customer_id=?, product_id=?, operation_id=?, mode=?, value=? WHERE id=?`,
          [Number(customer_id), Number(product_id), operation_id ? Number(operation_id) : null, mode || 'price', Number(value || 0), req.params.id]
        );
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:customer_pricing:update', error);
      return res.status(500).json({ ok: false, error: 'failed to update customer pricing' });
    }
  });

  router.delete('/customer_pricing/:id', async (req, res) => {
    try {
      const result = await withConnection(async (conn) => {
        await conn.query('DELETE FROM customer_pricing WHERE id=?', [req.params.id]);
        return { ok: true };
      });
      return res.json(result);
    } catch (error) {
      console.error('api:customer_pricing:delete', error);
      return res.status(500).json({ ok: false, error: 'failed to delete customer pricing' });
    }
  });

  // ==================== SPECIAL SERVICES ====================
  
  // WhatsApp - Send Invoice
  router.post('/whatsapp/send-invoice', async (req, res) => {
    try {
      const { invoice_id, phone, message } = req.body;
      if (!invoice_id || !phone) {
        return res.status(400).json({ ok: false, error: 'invoice_id and phone required' });
      }

      // Call WhatsApp service on primary device
      const whatsappService = require('./whatsapp-service');
      const result = await whatsappService.sendInvoiceToCustomer(invoice_id, phone, message);
      
      return res.json(result || { ok: true });
    } catch (error) {
      console.error('api:whatsapp:send', error);
      return res.status(500).json({ ok: false, error: 'failed to send WhatsApp message' });
    }
  });

  // WhatsApp - Check Status
  router.get('/whatsapp/status', async (req, res) => {
    try {
      const whatsappService = require('./whatsapp-service');
      const isReady = whatsappService.isWhatsAppReady ? whatsappService.isWhatsAppReady() : false;
      return res.json({ ok: true, ready: isReady });
    } catch (error) {
      console.error('api:whatsapp:status', error);
      return res.json({ ok: true, ready: false });
    }
  });

  // ZATCA - Sign Invoice (Electronic Invoicing)
  router.post('/zatca/sign-invoice', async (req, res) => {
    try {
      const { invoice_data } = req.body;
      if (!invoice_data) {
        return res.status(400).json({ ok: false, error: 'invoice_data required' });
      }

      // Call ZATCA service on primary device
      try {
        const zatcaService = require('./zatca-sales-integration');
        const result = await zatcaService.processInvoiceForZatca(invoice_data);
        return res.json(result || { ok: true });
      } catch (err) {
        console.error('ZATCA service error:', err);
        return res.json({ ok: false, error: 'ZATCA service not available' });
      }
    } catch (error) {
      console.error('api:zatca:sign', error);
      return res.status(500).json({ ok: false, error: 'failed to sign invoice' });
    }
  });

  // Print - Remote Print Invoice
  router.post('/print/invoice', async (req, res) => {
    try {
      const { invoice_id, printer_name, copies } = req.body;
      if (!invoice_id) {
        return res.status(400).json({ ok: false, error: 'invoice_id required' });
      }

      // This would trigger printing on the primary device
      // For now, we return success as printing happens locally
      console.log(`Remote print request for invoice ${invoice_id} to printer ${printer_name || 'default'}, ${copies || 1} copies`);
      
      return res.json({ 
        ok: true, 
        message: 'Print request received',
        note: 'Printing is handled on primary device' 
      });
    } catch (error) {
      console.error('api:print:invoice', error);
      return res.status(500).json({ ok: false, error: 'failed to print invoice' });
    }
  });

  // Customer Display - Send to Display
  router.post('/customer-display/show', async (req, res) => {
    try {
      const { text, action } = req.body;
      
      const customerDisplay = require('./customer-display/index');
      let result;
      
      switch (action) {
        case 'welcome':
          result = await customerDisplay.displayWelcome(text);
          break;
        case 'thankyou':
          result = await customerDisplay.displayThankYou(text);
          break;
        case 'total':
          result = await customerDisplay.displayTotal(parseFloat(text) || 0);
          break;
        case 'clear':
          result = await customerDisplay.clear();
          break;
        default:
          result = await customerDisplay.displayItem(text || '', 0);
      }
      
      return res.json(result || { ok: true });
    } catch (error) {
      console.error('api:customer-display:show', error);
      return res.status(500).json({ ok: false, error: 'failed to update customer display' });
    }
  });

  // ==================================================================================
  // BATCH API: Load all sales screen data in one request (VPN optimized)
  // ==================================================================================
  router.post('/batch/sales-screen-data', async (req, res) => {
    try {
      const { 
        load_products = true, 
        product_query = {},
        load_customers = true,
        load_drivers = true,
        load_settings = true,
        product_ids = null,
        customer_id = null
      } = req.body;
      
      const result = { ok: true };
      
      await withConnection(async (conn) => {
        // 1. Load products with all related data in optimized queries
        if (load_products && product_ids && product_ids.length > 0) {
          const placeholders = product_ids.map(() => '?').join(',');
          
          // Main product data
          const [products] = await conn.query(`
            SELECT 
              p.id, p.name, p.name_en, p.barcode, p.price, p.stock, 
              p.category, p.description, p.image_path, p.image_mime, 
              p.is_tobacco, p.is_active, p.sort_order, p.created_at
            FROM products p
            WHERE p.id IN (${placeholders}) AND p.is_active = 1
            ORDER BY p.sort_order ASC, p.name ASC
          `, product_ids);
          
          // Load all related data in parallel (4 queries instead of N*4)
          const [operations, offers, boms, customPricing] = await Promise.all([
            // Operations for products
            conn.query(`
              SELECT po.product_id, po.operation_id, o.name, o.name_en, o.is_active, po.price_adjustment, o.sort_order
              FROM product_operations po
              INNER JOIN operations o ON po.operation_id = o.id
              WHERE po.product_id IN (${placeholders}) AND o.is_active = 1
              ORDER BY o.sort_order ASC, o.name ASC
            `, product_ids),
            
            // Offers for products
            conn.query(`
              SELECT product_id, operation_id, offer_type, value, min_qty, start_date, end_date, description
              FROM offers
              WHERE product_id IN (${placeholders}) AND is_active = 1
                AND (start_date IS NULL OR start_date <= NOW())
                AND (end_date IS NULL OR end_date >= NOW())
            `, product_ids),
            
            // BOM (Bill of Materials) for products
            conn.query(`
              SELECT b.product_id, b.inventory_item_id, i.name, b.qty_consumed, i.unit, i.stock
              FROM bom b
              INNER JOIN inventory_items i ON b.inventory_item_id = i.id
              WHERE b.product_id IN (${placeholders})
            `, product_ids),
            
            // Custom pricing (if customer_id provided)
            customer_id ? conn.query(`
              SELECT cp.product_id, cp.customer_id, cp.custom_price
              FROM customer_pricing cp
              WHERE cp.product_id IN (${placeholders}) AND cp.customer_id = ?
            `, [...product_ids, customer_id]) : Promise.resolve([[]])
          ]);
          
          // Organize data by product_id for fast lookup
          const dataByProduct = {};
          
          products.forEach(p => {
            dataByProduct[p.id] = {
              ...p,
              operations: [],
              offers: [],
              bom: [],
              custom_price: null
            };
          });
          
          // Attach operations
          operations[0].forEach(op => {
            if (dataByProduct[op.product_id]) {
              dataByProduct[op.product_id].operations.push({
                id: op.operation_id,
                name: op.name,
                name_en: op.name_en,
                price_adjustment: op.price_adjustment,
                sort_order: op.sort_order
              });
            }
          });
          
          // Attach offers
          offers[0].forEach(offer => {
            if (dataByProduct[offer.product_id]) {
              dataByProduct[offer.product_id].offers.push(offer);
            }
          });
          
          // Attach BOM
          boms[0].forEach(bom => {
            if (dataByProduct[bom.product_id]) {
              dataByProduct[bom.product_id].bom.push(bom);
            }
          });
          
          // Attach custom pricing
          customPricing[0].forEach(cp => {
            if (dataByProduct[cp.product_id]) {
              dataByProduct[cp.product_id].custom_price = cp.custom_price;
            }
          });
          
          result.products = Object.values(dataByProduct);
          
        } else if (load_products) {
          // Load products list only (without full details)
          const productsResult = await fetchProducts(product_query);
          result.products = productsResult.items || [];
          result.products_count = productsResult.count;
          result.products_total = productsResult.total;
        }
        
        // 2. Load customers (if requested)
        if (load_customers) {
          const [customers] = await conn.query(`
            SELECT id, name, phone, email, vat_number, cr_number, is_active
            FROM customers
            WHERE is_active = 1
            ORDER BY name ASC
            LIMIT 500
          `);
          result.customers = customers;
        }
        
        // 3. Load drivers (if requested)
        if (load_drivers) {
          const [drivers] = await conn.query(`
            SELECT id, name, phone, active
            FROM drivers
            WHERE active = 1
            ORDER BY name ASC
          `);
          result.drivers = drivers;
        }
        
        // 4. Load settings (if requested)
        if (load_settings) {
          const [settings] = await conn.query('SELECT * FROM settings LIMIT 1');
          result.settings = settings[0] || {};
        }
      });
      
      // Compress response (gzip) for faster transfer over VPN
      const compressed = await compressApiResponse(result);
      return res.json(compressed);
      
    } catch (error) {
      console.error('api:batch:sales-screen-data', error);
      return res.status(500).json({ ok: false, error: 'failed to load batch data' });
    }
  });

  return router;
}

function startAPIServer(options = {}) {
  if (serverInstance) return serverInstance;
  const port = parseInteger(options.port || DEFAULT_API_PORT, DEFAULT_API_PORT);
  const host = options.host || DEFAULT_API_HOST;
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(compression({ 
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('tiny'));

  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'production' }));
  app.use('/api', createApiRouter());

  serverInstance = app.listen(port, host, () => {
    console.log(`✅ Primary API server listening on ${host}:${port} (compression enabled, optimized for VPN)`);
  });
  serverInstance.on('error', (error) => {
    console.error('Primary API server error', error);
  });
  return serverInstance;
}

function stopAPIServer() {
  if (!serverInstance) return;
  serverInstance.close(() => {
    serverInstance = null;
  });
}

module.exports = { startAPIServer, stopAPIServer };
