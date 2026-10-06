const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');

const ROOT = __dirname;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CMS_DIR = path.join(ROOT, 'public', 'admin');
const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE = 'novariyan_admin';
const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'novariyan.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    image_alt TEXT NOT NULL DEFAULT '',
    visible INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const defaultSettings = {
  brandName: 'Novariyan',
  logoImageUrl: '/logo.png',
  accentColor: '#B4232F',
  whatsappNumber: '918471986282',
  heroEyebrow: 'India’s digital growth studio',
  heroTitleLead: 'We build digital brands that',
  heroTitleAccent: 'win online.',
  heroTitleEnd: 'Web • AI • Design • Ads',
  heroIntro: 'Novariyan is India’s best studio for web development, graphic designing, advertisement and AI automation — building websites, experiences and smart systems that turn attention into revenue.',
  introEyebrow: 'The Novariyan promise',
  introTitleLead: 'Less noise.',
  introTitleAccent: 'More growth.',
  introTitleEnd: 'Clearer results.',
  introBody: 'We combine strategy, design, development and automation so your brand looks premium, communicates clearly and performs in the real world. Every decision is shaped around conversion, trust and the way your audience actually buys.',
  workEyebrow: 'A glimpse of what could be',
  workTitleLead: 'Ideas, given',
  workTitleAccent: 'a digital shape.',
  workDescription: 'These are illustrative concept directions created to show our approach — not commissioned client projects or claims of delivered work.',
  servicesEyebrow: 'What we build',
  servicesTitleLead: 'Websites that sell.',
  servicesTitleAccent: 'Systems that scale.',
  servicesDescription: 'From web development and brand design to AI automation and performance advertising, we build the digital engine behind ambitious businesses.',
  service1Title: 'Web Development',
  service1Tagline: 'High-converting websites and web apps.',
  service1Detail: 'Bespoke business websites, landing pages, portfolios and storefronts designed to look premium, load fast, rank in search and guide visitors toward action.',
  service2Title: 'AI Automation',
  service2Tagline: 'Smarter operations, less manual work.',
  service2Detail: 'AI-powered lead qualification, inquiry routing, FAQ support, follow-up sequences and workflow automation that save time without taking away human control.',
  service3Title: 'Graphic Designing',
  service3Tagline: 'Clean design that tells your story.',
  service3Detail: 'Branding, social creatives, presentation design, marketing graphics and visual systems that help your business look sharper, clearer and more trustworthy.',
  service4Title: 'Advertisement & Growth Marketing',
  service4Tagline: 'Strategy, creative and performance together.',
  service4Detail: 'Digital ads, funnel design, campaign creative, retargeting and growth-focused marketing that turn clicks into qualified opportunities and measurable results.',
  industriesEyebrow: 'Built around your world',
  industriesTitleLead: 'Different businesses.',
  industriesTitleAccent: 'Different details.',
  industriesDescription: 'The right digital experience understands what your customers need to see, feel and do next.',
  industry1Title: 'Real estate',
  industry1Tagline: 'Make every property easier to discover.',
  industry1Detail: 'Property listing websites, searchable inventories, detailed listing pages, location-led storytelling and enquiry funnels that help prospective buyers and renters take the next step.',
  industry1Link: 'Explore a property website',
  industry1Tag: '01 / Property',
  industry1ImageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  industry2Title: 'E-commerce',
  industry2Tagline: 'Give good products a clear stage.',
  industry2Detail: 'Branded storefronts, intuitive product discovery, clear product pages, smoother checkout journeys and considerate post-enquiry or post-purchase follow-up.',
  industry2Link: 'Explore an online store',
  industry2Tag: '02 / Commerce',
  industry2ImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  industry3Title: 'Hotels & resorts',
  industry3Tagline: 'Let the stay begin before arrival.',
  industry3Detail: 'Atmospheric destination websites, room and amenity discovery, booking pathways, pre-arrival information and guest communication that feels personal.',
  industry3Link: 'Explore hospitality experiences',
  industry3Tag: '03 / Hospitality',
  industry3ImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=85',
  heroImageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
  automationImageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85',
  automationImageCaption: 'Human judgement, supported by useful systems.',
  automationEyebrow: 'AI that earns its place',
  automationTitleLead: 'Let the routine\nrun lighter.',
  automationTitleAccent: 'Keep\npeople in control.',
  automationIntro: 'Automation should solve a specific problem, not add another layer of complexity. We map the workflow first, then design sensible assistance around it.',
  workflow1Title: 'Lead qualification',
  workflow1Detail: 'Organise new enquiries by intent, service needs and urgency for a team member to review.',
  workflow2Title: 'Routine FAQs',
  workflow2Detail: 'Draft or answer approved, frequently asked questions using your information and clear escalation rules.',
  workflow3Title: 'Enquiry routing',
  workflow3Detail: 'Direct property, product, booking and support requests to the appropriate person or inbox.',
  workflow4Title: 'Follow-ups & admin',
  workflow4Detail: 'Prepare appointment reminders, follow-up tasks and repetitive records while leaving exceptions to people.',
  handoffTitle: 'Human handoff, by design.',
  handoffText: 'Ambiguous requests, sensitive situations and consequential decisions can be flagged for a person instead of being left to automation.',
  automationCta: 'Talk through a workflow',
  approachEyebrow: 'A clear way forward',
  approachTitleLead: 'Thoughtful from',
  approachTitleAccent: 'first conversation.',
  approachDescription: 'No mystery process. Just shared context, considered decisions and a clear next step at each stage.',
  process1Title: 'Listen & map',
  process1Detail: 'We start with your business, audience, current tools and what needs to work better. Together, we define the real problem before choosing a solution.',
  process1Foot: 'CLARITY BEFORE COMPLEXITY',
  process2Title: 'Shape & build',
  process2Detail: 'We turn the brief into a clear direction, then design and build the experience or workflow with regular opportunities for your input.',
  process2Foot: 'DESIGNED WITH INTENTION',
  process3Title: 'Refine & hand over',
  process3Detail: 'We test the details, make refinements, and walk through how everything works so your team knows what to expect and how to use it.',
  process3Foot: 'READY FOR REAL LIFE',
  contactEyebrow: 'The beginning of something useful',
  contactTitle: 'Tell us what you have in mind.',
  contactIntro: "Share a little about your business and what you'd like to make better. Your enquiry will open in WhatsApp, ready for you to review and send.",
  footerTagline: 'Digital experiences with a little more thought.',
  footerNoteHeading: 'A NOTE ON OUR WORK',
  footerNoteText: 'Every business has its own context. We believe the right digital solution starts by understanding it — and stays useful by keeping people involved.',
  footerSecondLine: 'Considered design. Practical technology.'
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) insertSetting.run(key, value);
const migrateSetting = db.prepare('UPDATE settings SET value = ? WHERE key = ? AND value = ?');
migrateSetting.run(defaultSettings.contactTitle, 'contactTitle', 'Have a project in mind?');
migrateSetting.run(defaultSettings.contactIntro, 'contactIntro', 'Tell us what you are working on. We will help you find a useful next step.');

const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
if (projectCount === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (title, category, description, image_url, image_alt, visible, sort_order)
    VALUES (@title, @category, @description, @image_url, @image_alt, 1, @sort_order)
  `);
  const seedProjects = db.transaction(() => {
    [
      {
        title: 'Casa Forme',
        category: 'Property / Editorial listing experience',
        description: 'Concept project 01',
        image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
        image_alt: 'Sculptural contemporary home surrounded by greenery',
        sort_order: 1
      },
      {
        title: 'Objects & Ritual',
        category: 'Commerce / Product-led storefront',
        description: 'Concept project 02',
        image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
        image_alt: 'Thoughtfully styled interior with tactile materials and restrained objects',
        sort_order: 2
      },
      {
        title: 'Stillwater House',
        category: 'Hospitality / Direct booking experience',
        description: 'Concept project 03',
        image_url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85',
        image_alt: 'Calm boutique hotel room with soft natural light',
        sort_order: 3
      }
    ].forEach((project) => insertProject.run(project));
  });
  seedProjects();
}

let sessionSecret = db.prepare('SELECT value FROM app_meta WHERE key = ?').get('session_secret')?.value;
if (!sessionSecret) {
  sessionSecret = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('session_secret', sessionSecret);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '64kb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
    callback(allowed.has(file.mimetype) ? null : new Error('Upload a JPG, PNG, WebP, GIF, or AVIF image.'), allowed.has(file.mimetype));
  }
});

function setAdminCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_LIFETIME / 1000}${secure}`);
}

function clearAdminCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ expires: Date.now() + SESSION_LIFETIME })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function isValidSession(req) {
  const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return false;
  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest();
  let received;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return false;
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).expires > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  if (!isValidSession(req)) return res.status(401).json({ error: 'Please sign in again.' });
  next();
}

function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin || !req.get('host')) return res.status(403).json({ error: 'Request origin could not be verified.' });
  try {
    if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Cross-origin request rejected.' });
  } catch {
    return res.status(403).json({ error: 'Request origin could not be verified.' });
  }
  next();
}

app.use('/api/admin', (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return requireSameOrigin(req, res, next);
  next();
});
app.use('/api/admin', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const loginAttempts = new Map();
function checkLoginRate(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (attempt.resetAt <= now) {
    attempt.count = 0;
    attempt.resetAt = now + 15 * 60 * 1000;
  }
  if (attempt.count >= 8) return res.status(429).json({ error: 'Too many attempts. Wait 15 minutes and try again.' });
  req.loginAttempt = attempt;
  next();
}

function passwordRecord() {
  const record = db.prepare('SELECT value FROM app_meta WHERE key = ?').get('admin_password');
  return record?.value ? JSON.parse(record.value) : null;
}

function savePassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  db.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run('admin_password', JSON.stringify({ salt, hash }));
}

function verifyPassword(password, record) {
  if (!record || typeof password !== 'string') return false;
  const actual = crypto.scryptSync(password, record.salt, 64);
  const expected = Buffer.from(record.hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

const settingsRows = db.prepare('SELECT key, value FROM settings');
const listProjects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
const getProject = db.prepare('SELECT * FROM projects WHERE id = ?');

function readSettings() {
  return Object.fromEntries(settingsRows.all().map(({ key, value }) => [key, value]));
}

function projectForApi(row) {
  return { ...row, visible: Boolean(row.visible) };
}

function normalizeProject(input) {
  const values = {
    title: String(input.title || '').trim(),
    category: String(input.category || '').trim(),
    description: String(input.description || '').trim(),
    image_url: String(input.image_url || '').trim(),
    image_alt: String(input.image_alt || '').trim(),
    visible: input.visible === false || input.visible === 0 || input.visible === '0' ? 0 : 1,
    sort_order: Number(input.sort_order)
  };
  if (!values.title || values.title.length > 100) throw new Error('Project title is required and must be 100 characters or fewer.');
  if (!values.category || values.category.length > 120) throw new Error('Project category is required and must be 120 characters or fewer.');
  if (values.description.length > 500 || values.image_alt.length > 180) throw new Error('Project description or image text is too long.');
  if (!Number.isInteger(values.sort_order) || values.sort_order < 0 || values.sort_order > 99999) throw new Error('Display order must be a whole number from 0 to 99999.');
  if (values.image_url && !values.image_url.startsWith('/uploads/') && !/^https:\/\//i.test(values.image_url)) throw new Error('Images must use an HTTPS URL or an uploaded image.');
  return values;
}

function removeUploadedImage(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const filename = path.basename(url);
  if (filename !== url.slice('/uploads/'.length)) return;
  const referenced = db.prepare(`
    SELECT 1 FROM projects WHERE image_url = ?
    UNION ALL
    SELECT 1 FROM settings WHERE value = ?
    LIMIT 1
  `).get(url, url);
  if (referenced) return;
  fs.rm(path.join(UPLOAD_DIR, filename), { force: true }, () => {});
}

const settingLimits = Object.fromEntries(Object.keys(defaultSettings).map((key) => [
  key,
  key.endsWith('ImageUrl') ? 1000 : /Detail|Description|Body|Intro|Text|Lead|Accent/.test(key) ? 700 : 180
]));

app.get('/api/content', (_req, res) => {
  res.json({
    settings: readSettings(),
    projects: listProjects.all().filter((project) => project.visible).map(projectForApi)
  });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: isValidSession(req), setupRequired: !passwordRecord() });
});

app.post('/api/admin/setup', checkLoginRate, (req, res) => {
  if (passwordRecord()) return res.status(409).json({ error: 'Admin access has already been set up. Sign in instead.' });
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
    req.loginAttempt.count += 1;
    loginAttempts.set(req.ip, req.loginAttempt);
    return res.status(400).json({ error: 'Use a password between 12 and 200 characters.' });
  }
  savePassword(password);
  loginAttempts.delete(req.ip);
  setAdminCookie(res, createSessionToken());
  res.status(201).json({ authenticated: true });
});

app.post('/api/admin/login', checkLoginRate, (req, res) => {
  const password = req.body?.password;
  if (!passwordRecord() || !verifyPassword(password, passwordRecord())) {
    req.loginAttempt.count += 1;
    loginAttempts.set(req.ip, req.loginAttempt);
    return res.status(401).json({ error: 'The password did not match.' });
  }
  loginAttempts.delete(req.ip);
  setAdminCookie(res, createSessionToken());
  res.json({ authenticated: true });
});

app.post('/api/admin/logout', requireAdmin, (_req, res) => {
  clearAdminCookie(res);
  res.json({ authenticated: false });
});

app.get('/api/admin/data', requireAdmin, (_req, res) => {
  res.json({ settings: readSettings(), projects: listProjects.all().map(projectForApi) });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const changes = req.body?.settings;
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return res.status(400).json({ error: 'Settings are required.' });
  const previousValues = Object.fromEntries(Object.keys(changes).map((key) => [key, db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value]));
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const save = db.transaction(() => {
    for (const [key, value] of Object.entries(changes)) {
      if (!(key in defaultSettings)) throw new Error(`Unknown setting: ${key}`);
      if (typeof value !== 'string' || value.trim().length === 0 || value.length > settingLimits[key]) throw new Error(`${key} must be between 1 and ${settingLimits[key]} characters.`);
      if (key === 'whatsappNumber' && !/^\+?[0-9 ()-]{8,20}$/.test(value)) throw new Error('Enter a valid WhatsApp phone number.');
      if (key.endsWith('ImageUrl') && value !== '/logo.png' && !value.startsWith('/uploads/') && !/^https:\/\//i.test(value)) throw new Error(`${key} must be an HTTPS URL or an uploaded image.`);
      if (key === 'accentColor' && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Choose a valid six-digit brand accent color.');
      update.run(key, value.trim());
    }
  });
  try {
    save();
    for (const [key, previousValue] of Object.entries(previousValues)) {
      if (previousValue !== changes[key]) removeUploadedImage(previousValue);
    }
    res.json({ settings: readSettings() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/uploads', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });
  const { buffer, mimetype } = req.file;
  const signatures = {
    'image/jpeg': buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    'image/png': buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/gif': buffer.subarray(0, 3).toString() === 'GIF',
    'image/webp': buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP',
    'image/avif': buffer.subarray(4, 8).toString() === 'ftyp' && ['avif', 'avis'].includes(buffer.subarray(8, 12).toString())
  };
  if (!signatures[mimetype]) return res.status(400).json({ error: 'The uploaded file does not match its image type.' });
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/avif': 'avif' }[mimetype];
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer, { flag: 'wx' });
  res.status(201).json({ url: `/uploads/${filename}` });
});

app.post('/api/admin/projects', requireAdmin, (req, res) => {
  try {
    const project = normalizeProject(req.body || {});
    const result = db.prepare(`
      INSERT INTO projects (title, category, description, image_url, image_alt, visible, sort_order)
      VALUES (@title, @category, @description, @image_url, @image_alt, @visible, @sort_order)
    `).run(project);
    res.status(201).json({ project: projectForApi(getProject.get(result.lastInsertRowid)) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const existing = getProject.get(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Project not found.' });
  try {
    const project = normalizeProject(req.body || {});
    db.prepare(`
      UPDATE projects
      SET title = @title, category = @category, description = @description,
          image_url = @image_url, image_alt = @image_alt, visible = @visible,
          sort_order = @sort_order, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ ...project, id: existing.id });
    if (existing.image_url !== project.image_url) removeUploadedImage(existing.image_url);
    res.json({ project: projectForApi(getProject.get(existing.id)) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const existing = getProject.get(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Project not found.' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(existing.id);
  removeUploadedImage(existing.image_url);
  res.status(204).end();
});
app.get('/googlee0f1d2e46885df4c.html', (_req, res) => {
  res.type('text/plain').send('google-site-verification: googlee0f1d2e46885df4c.html');
});

app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/privacy-policy.html', (_req, res) => res.sendFile(path.join(ROOT, 'privacy-policy.html')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(ROOT, 'styles.css')));
app.get('/script.js', (_req, res) => res.sendFile(path.join(ROOT, 'script.js')));
app.get('/logo.png', (_req, res) => res.sendFile(path.join(ROOT, 'logo.png')));
app.get('/admin', (_req, res) => res.sendFile(path.join(CMS_DIR, 'index.html')));
app.use('/cms-assets', express.static(CMS_DIR, { dotfiles: 'deny', index: false }));
app.use('/public', express.static(path.join(ROOT, 'public'), { dotfiles: 'deny', index: false }));
app.use('/uploads', express.static(UPLOAD_DIR, { dotfiles: 'deny', index: false, maxAge: '1d' }));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Images must be 8 MB or smaller.' : 'The image upload could not be processed.';
    return res.status(400).json({ error: message });
  }
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON request.' });
  if (error.message?.startsWith('Upload a ')) return res.status(400).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Novariyan CMS listening on port ${PORT}`);
});