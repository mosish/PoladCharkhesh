import { Router, Request, Response } from 'express';
import { requireAuth, createRateLimiter, logAudit } from '../middleware';
import { inquiryDb } from '../services/inquiryDb';
import { validateInquiryPayload } from '../validation';

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
  const validation = validateInquiryPayload(req.body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    return;
  }

  const id = inquiryDb.createInquiry(validation.sanitized!, req.ip);

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
  const inquiries = inquiryDb.getInquiries();
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

  const success = inquiryDb.updateInquiryStatus(id, status);
  if (!success) {
    res.status(404).json({ error: 'استعلام مورد نظر یافت نشد.' });
    return;
  }

  logAudit('INQUIRY_STATUS_UPDATED', 'inquiry', `وضعیت استعلام به ${status} تغییر یافت.`, req, id, { status });

  res.json({ success: true, id, status });
});
