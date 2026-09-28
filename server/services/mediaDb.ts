import { randomUUID, createHash } from 'node:crypto';
import { getDatabase, runTransaction } from '../db';
import type { MediaMetadata } from '../../src/types/admin';
import { isSafeAssetUrl } from '../../src/utils/contentModel';

export class MediaError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function productMedia(row: any) {
  const images = [...new Set<string>([row.image_url, ...JSON.parse(row.images || '[]')].filter(Boolean))];
  const pdfUrl = row.pdf_url || '';
  return { images, imageUrl: row.image_url || images[0] || '', pdfUrl,
    version: createHash('sha256').update(JSON.stringify([row.image_url, row.images, row.pdf_url])).digest('hex') };
}
function productRows(): any[] { return getDatabase().prepare('SELECT id,code,image_url,images,pdf_url FROM products').all() as any[]; }
function references(url: string): string[] {
  const db = getDatabase();
  const refs = productRows().filter(row => { const m = productMedia(row); return m.images.includes(url) || m.pdfUrl === url; }).map(row => row.code);
  const contains = (value: any): boolean => typeof value === 'string' ? value === url : !!value && typeof value === 'object' && Object.values(value).some(contains);
  for (const table of ['cms_content', 'seo_config', 'company_info']) {
    const row = db.prepare('SELECT data FROM ' + table + ' WHERE id=?').get('main') as any;
    if (row && contains(JSON.parse(row.data))) refs.push(table);
  }
  return refs;
}
function fromRow(row: any): MediaMetadata {
  return { id: row.id, filename: row.filename, originalName: row.original_name, mimeType: row.mime_type,
    sizeBytes: row.size_bytes, url: row.url, createdAt: row.created_at, createdBy: row.created_by,
    ...JSON.parse(row.metadata || '{}'), isArchived: !!row.is_archived, revision: row.revision,
    associatedProductCodes: productRows().filter(product => {
      const media = productMedia(product); return media.images.includes(row.url) || media.pdfUrl === row.url;
    }).map(product => product.code) };
}
export const mediaDb = {
  getMediaList(category?: string, includeArchived = false): MediaMetadata[] {
    this.indexProductAssets();
    const rows = getDatabase().prepare('SELECT * FROM media_metadata ORDER BY created_at DESC').all() as any[];
    return rows.filter(row => includeArchived || !row.is_archived).map(fromRow).filter(item => !category || item.category === category);
  },
  getMediaById(id: string): MediaMetadata | null {
    const row = getDatabase().prepare('SELECT * FROM media_metadata WHERE id=?').get(id);
    return row ? fromRow(row) : null;
  },
  createMediaRecord(data: Omit<MediaMetadata, 'id' | 'createdAt' | 'filename'> & { filename?: string }, username: string): MediaMetadata {
    const db = getDatabase();
    if (db.prepare('SELECT id FROM media_metadata WHERE url=?').get(data.url)) throw new MediaError(409, 'This URL is already registered. / این آدرس قبلاً ثبت شده است.');
    const id = randomUUID();
    const metadata = { altTextFa: data.altTextFa ?? '', altTextEn: data.altTextEn ?? '', category: data.category ?? (data.mimeType === 'application/pdf' ? 'datasheet_pdf' : 'product_photo'), width: data.width, height: data.height };
    db.prepare('INSERT INTO media_metadata (id,filename,original_name,mime_type,size_bytes,url,created_at,created_by,metadata) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, data.filename || data.originalName, data.originalName, data.mimeType, data.sizeBytes, data.url, new Date().toISOString(), username, JSON.stringify(metadata));
    return this.getMediaById(id)!;
  },
  updateMetadata(id: string, data: Partial<MediaMetadata>): MediaMetadata {
    const current = this.getMediaById(id);
    if (!current) throw new MediaError(404, 'Media not found');
    if (data.revision !== current.revision) throw new MediaError(409, 'Media changed. Reload before saving. / ابتدا بازخوانی کنید.');
    const metadata = { altTextFa: data.altTextFa ?? current.altTextFa, altTextEn: data.altTextEn ?? current.altTextEn,
      category: data.category ?? current.category, width: current.width, height: current.height };
    const result = getDatabase().prepare('UPDATE media_metadata SET original_name=?,metadata=?,revision=revision+1 WHERE id=? AND revision=?')
      .run(data.originalName ?? current.originalName, JSON.stringify(metadata), id, current.revision!);
    if (!result.changes) throw new MediaError(409, 'Media changed. Reload before saving.');
    return this.getMediaById(id)!;
  },
  archive(id: string, archived: boolean): MediaMetadata {
    return runTransaction(() => {
    const current = this.getMediaById(id);
    if (!current) throw new MediaError(404, 'Media not found');
    if (archived && references(current.url).length) throw new MediaError(409, 'Asset is still in use: ' + references(current.url).join(', '));
    getDatabase().prepare('UPDATE media_metadata SET is_archived=?,revision=revision+1 WHERE id=?').run(archived ? 1 : 0, id);
    return this.getMediaById(id)!;
    });
  },
  indexProductAssets(): void {
    const db = getDatabase();
    for (const row of productRows()) {
      const media = productMedia(row);
      for (const url of [...media.images, media.pdfUrl].filter(Boolean)) {
        if (!isSafeAssetUrl(url) || db.prepare('SELECT id FROM media_metadata WHERE url=?').get(url)) continue;
        const filename = url.split('/').pop()?.split('?')[0] || 'Asset';
        const pdf = url === media.pdfUrl;
        this.createMediaRecord({ url, originalName: filename, mimeType: pdf ? 'application/pdf' : /\.png(?:\?|$)/i.test(url) ? 'image/png' : /\.webp(?:\?|$)/i.test(url) ? 'image/webp' : 'image/jpeg', sizeBytes: 0 }, 'catalog-index');
      }
    }
  },
  getProductMedia(id: string) {
    const row = getDatabase().prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!row) throw new MediaError(404, 'Product not found');
    return productMedia(row);
  },
  changeProductMedia(id: string, input: { action: string; mediaId?: string; toIndex?: number; version: string }, username: string) {
    return runTransaction(db => {
      const current = this.getProductMedia(id);
      if (input.version !== current.version) throw new MediaError(409, 'Gallery changed. Reload before saving. / گالری تغییر کرده است؛ ابتدا بازخوانی کنید.');
      const item = input.mediaId ? this.getMediaById(input.mediaId) : null;
      if (input.action !== 'clearPdf' && (!item || item.isArchived)) throw new MediaError(400, 'Select an active media asset');
      let images = [...current.images]; let pdfUrl = current.pdfUrl;
      const url = item?.url || '';
      if (['attach', 'detach', 'primary', 'move'].includes(input.action) && !item?.mimeType.startsWith('image/')) throw new MediaError(400, 'Select an image');
      switch (input.action) {
        case 'attach': if (!images.includes(url)) images.push(url); break;
        case 'detach': images = images.filter(image => image !== url); break;
        case 'primary':
          if (!images.includes(url)) throw new MediaError(400, 'Attach this image first');
          images = [url, ...images.filter(image => image !== url)]; break;
        case 'move': {
          const index = images.indexOf(url);
          if (index < 0 || !Number.isInteger(input.toIndex) || input.toIndex! < 0 || input.toIndex! >= images.length) throw new MediaError(400, 'Invalid image position');
          images.splice(index, 1); images.splice(input.toIndex!, 0, url); break;
        }
        case 'setPdf': if (item?.mimeType !== 'application/pdf') throw new MediaError(400, 'Select a PDF'); pdfUrl = url; break;
        case 'clearPdf': pdfUrl = ''; break;
        default: throw new MediaError(400, 'Invalid gallery action');
      }
      if (images.length > 50) throw new MediaError(400, 'Maximum 50 images per product');
      db.prepare('UPDATE products SET image_url=?,images=?,pdf_url=?,updated_at=?,updated_by=? WHERE id=?')
        .run(images[0] || '', JSON.stringify(images), pdfUrl, new Date().toISOString(), username, id);
      return this.getProductMedia(id);
    });
  },
};
