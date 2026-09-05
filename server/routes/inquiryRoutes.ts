import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { requireAuth, createRateLimiter, logAudit } from '../middleware';

export const inquiryRouter = Router();

const inquiryLimiter = createRateLimiter({
  max: 10,
  windowMs: 10 * 60 * 1000,
  message: 'تعداد درخواست‌های ثبت استعلام بیش از حد مجاز است. لطفاً بعداً تلاش فرمایید.',
});

/**
 * POST /api/inquiries
 * Public customer inquiry submission
 */
inquiryRouter.post('/', inquiryLimiter, (req: Request, res: Response): void => {
  const { fullName, phone, message, company, email } = req.body || {};

  const cleanName = String(fullName || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!cleanName || !cleanPhone) {
    res.status(400).json({ error: 'نام و شماره تماس الزامی می‌باشند.' });
    return;
  }

  const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const db = getDatabase();

  db.prepare(`
    INSERT INTO inquiries (id, timestamp, full_name, phone, message, company, email, status, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?);
  `).run(
    id,
    nowIso,
    cleanName,
    cleanPhone,
    cleanMessage,
    company ? String(company).trim() : null,
    email ? String(email).trim() : null,
    req.ip || null
  );

  res.status(201).json({
    success: true,
    id,
    message: 'استعلام فنی شما با موفقیت در سامانه ثبت گردید. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
  });
});

/**
 * GET /api/inquiries
 * Protected list of inquiries for Admin panel
 */
inquiryRouter.get('/', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY timestamp DESC;').all() as any[];

  const inquiries = rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    fullName: r.full_name,
    phone: r.phone,
    message: r.message,
    company: r.company || undefined,
    email: r.email || undefined,
    status: r.status,
  }));

  res.json({ inquiries });
});

/**
 * PATCH /api/inquiries/:id/status
 * Protected update inquiry status
 */
inquiryRouter.patch('/:id/status', requireAuth, (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const { status } = req.body || {};

  const validStatuses = ['new', 'reviewed', 'contacted', 'closed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'وضعیت نامعتبر است.' });
    return;
  }

  const db = getDatabase();
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?;').run(status, id);

  res.json({ success: true, id, status });
});
