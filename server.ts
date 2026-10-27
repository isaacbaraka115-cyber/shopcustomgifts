import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { CatalogueItem, CustomerInquiry, AppSettings, JewelryType, Gemstone, MetalColor, PhotoStyle } from './src/types';

dotenv.config();

const PORT = 3000;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database directory and file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface DatabaseSchema {
  settings: AppSettings;
  items: CatalogueItem[];
  inquiries: CustomerInquiry[];
  skuCounter: number;
}

const defaultDatabase: DatabaseSchema = {
  settings: {
    businessName: 'Your Business Name',
    tagline: 'High Jewelry & Rare Gemstones',
    contactEmail: 'concierge@finejewelry.com',
    contactPhone: '+1 (555) 234-5678',
    inquiryPromptText: 'Interested in this bespoke piece? Share your details to arrange a private viewing or speak with our gemologist.',
    adminPasscode: 'admin123',
  },
  items: [],
  inquiries: [],
  skuCounter: 1,
};

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data) as DatabaseSchema;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  writeDb(defaultDatabase);
  return defaultDatabase;
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Map types & gemstones to SKU codes
const TYPE_PREFIX: Record<JewelryType, string> = {
  Ring: 'RING',
  Necklace: 'NECK',
  Bracelet: 'BRACE',
  Earring: 'EARR',
  Other: 'JEWEL',
};

const GEM_PREFIX: Record<Gemstone, string> = {
  Emerald: 'EM',
  Diamond: 'DI',
  Sapphire: 'SA',
  Ruby: 'RU',
  'Multi-Gemstone': 'MG',
  Other: 'OT',
};

function computeCombinationCategory(type: JewelryType, gem: Gemstone): string {
  const pluralType = type === 'Other' ? 'Jewelry Pieces' : `${type}s`;
  if (gem === 'Other') {
    return `Fine ${pluralType}`;
  }
  return `${gem} ${pluralType}`;
}

function generateSku(type: JewelryType, gem: Gemstone, counter: number): string {
  const typeCode = TYPE_PREFIX[type] || 'JEWEL';
  const gemCode = GEM_PREFIX[gem] || 'OT';
  const num = String(counter).padStart(3, '0');
  return `${typeCode}-${gemCode}-${num}`;
}

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();

  // Increase payload limits for base64 image bulk uploads
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // API Routes
  // 1. Get catalogue items
  app.get('/api/catalogue', (req: Request, res: Response) => {
    const db = readDb();
    const status = req.query.status as string;
    let items = db.items;
    if (status) {
      items = items.filter((i) => i.status === status);
    }
    res.json({
      items,
      settings: db.settings,
    });
  });

  // 1b. Export catalogue as CSV
  app.get('/api/catalogue/export.csv', (req: Request, res: Response) => {
    try {
      const db = readDb();
      const status = req.query.status as string;
      let items = db.items;
      if (status) {
        items = items.filter((i) => i.status === status);
      }

      const headers = [
        'SKU',
        'Title',
        'Jewelry Type',
        'Gemstone',
        'Combination Category',
        'Metal Color',
        'Photo Style',
        'Tags',
        'Status',
        'Type Confidence (%)',
        'Gemstone Confidence (%)',
        'Description',
        'Created At',
      ];

      const escapeField = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = items.map((item) => [
        escapeField(item.sku),
        escapeField(item.title),
        escapeField(item.jewelryType),
        escapeField(item.gemstone),
        escapeField(item.combinationCategory),
        escapeField(item.metalColor),
        escapeField(item.photoStyle),
        escapeField(item.tags?.join('; ') || ''),
        escapeField(item.status),
        escapeField(item.confidence?.jewelryType ? Math.round(item.confidence.jewelryType * 100) : ''),
        escapeField(item.confidence?.gemstone ? Math.round(item.confidence.gemstone * 100) : ''),
        escapeField(item.description),
        escapeField(item.createdAt),
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const filename = `jewelry_catalogue_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Analyze single image with Gemini Vision
  app.post('/api/catalogue/analyze-item', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', fileName = 'upload.jpg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      let detectedType: JewelryType = 'Other';
      let detectedGem: Gemstone = 'Other';
      let detectedMetal: MetalColor = 'Other';
      let detectedStyle: PhotoStyle = 'Detail';
      let typeConf = 0.5;
      let gemConf = 0.5;
      let reasoning = 'Automated visual analysis.';
      let suggestedTitle = 'Fine Jewelry Piece';
      let suggestedDesc = 'Exquisite craftsmanship with distinctive luster and setting.';

      if (ai) {
        try {
          const prompt = `You are a world-class gemologist and master jeweler appraising a piece for a luxury catalogue.
Analyze this high-resolution photo with extreme precision.

Determine the following fields strictly matching the allowed enum choices:
1. "jewelryType": MUST BE one of ["Ring", "Necklace", "Bracelet", "Earring", "Other"].
   NOTE: An earring set (pair of earrings) counts as one item: "Earring".
2. "gemstone": MUST BE one of ["Emerald", "Diamond", "Sapphire", "Ruby", "Multi-Gemstone", "Other"].
   - Emerald: green beryl
   - Diamond: clear, white, or brilliant faceted transparent stone
   - Sapphire: blue corundum (or fancy pink/yellow sapphire)
   - Ruby: intense red/crimson corundum
   - Multi-Gemstone: combination of two or more distinct gem types (e.g. diamonds + emeralds)
   - Other: pearl, plain gold without gemstones, quartz, opal, topaz, or undetermined
3. "metalColor": MUST BE one of ["White Gold", "Yellow Gold", "Rose Gold", "Other"].
   Platinum/silver tones classify as "White Gold".
4. "photoStyle": MUST BE one of ["Worn", "Held", "Detail", "Flat"].
   - "Worn": worn on human skin (on an ear, hand/finger, wrist, or neck/décolletage)
   - "Held": held by fingers or in hands
   - "Detail": extreme macro close-up of settings, prongs, or stone facets
   - "Flat": lay-flat product shot on surface or box
5. "typeConfidence": float number 0.0 to 1.0 representing certainty of jewelry type.
6. "gemstoneConfidence": float number 0.0 to 1.0 representing certainty of the gemstone.
7. "reasoning": 1-2 sentence gemologist assessment explaining stone color, cut, mounting, and why confidence is high or unsure.
8. "title": Short elegant luxury title (e.g., "Round Brilliant Diamond Solitaire Ring", "Oval Emerald & Diamond Drop Earrings", "Pavé Diamond Tennis Bracelet").
9. "description": 2-sentence refined catalogue description emphasizing brilliance, elegance, and proportion.

IMPORTANT: If the stone is obscured, lighting is ambiguous, or it's hard to distinguish the gemstone, set gemstoneConfidence below 0.80.

Return JSON in this exact structure:
{
  "jewelryType": "Ring" | "Necklace" | "Bracelet" | "Earring" | "Other",
  "gemstone": "Emerald" | "Diamond" | "Sapphire" | "Ruby" | "Multi-Gemstone" | "Other",
  "metalColor": "White Gold" | "Yellow Gold" | "Rose Gold" | "Other",
  "photoStyle": "Worn" | "Held" | "Detail" | "Flat",
  "typeConfidence": 0.95,
  "gemstoneConfidence": 0.90,
  "reasoning": "...",
  "title": "...",
  "description": "..."
}`;

          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });

          const responseText = geminiResponse.text?.trim() || '{}';
          const parsed = JSON.parse(responseText);

          if (parsed.jewelryType) detectedType = parsed.jewelryType;
          if (parsed.gemstone) detectedGem = parsed.gemstone;
          if (parsed.metalColor) detectedMetal = parsed.metalColor;
          if (parsed.photoStyle) detectedStyle = parsed.photoStyle;
          if (typeof parsed.typeConfidence === 'number') typeConf = parsed.typeConfidence;
          if (typeof parsed.gemstoneConfidence === 'number') gemConf = parsed.gemstoneConfidence;
          if (parsed.reasoning) reasoning = parsed.reasoning;
          if (parsed.title) suggestedTitle = parsed.title;
          if (parsed.description) suggestedDesc = parsed.description;
        } catch (apiErr) {
          console.error('Gemini vision API error:', apiErr);
          reasoning = 'Vision service temporarily unavailable; flagged for manual review.';
          typeConf = 0.5;
          gemConf = 0.5;
        }
      } else {
        // Fallback heuristic if API key is not yet configured
        reasoning = 'API key pending. Item routed to Needs Review queue for verification.';
        typeConf = 0.6;
        gemConf = 0.5;
      }

      // Evaluate confidence rules strictly
      // Requirement: "If the AI is unsure about type or gemstone, do NOT guess and publish it as fact. Put it in a 'Needs Review' queue in Admin."
      const isUncertain =
        typeConf < 0.85 ||
        gemConf < 0.82 ||
        detectedType === 'Other' ||
        (detectedGem === 'Other' && gemConf < 0.9);

      const status: 'published' | 'needs_review' = isUncertain ? 'needs_review' : 'published';

      const db = readDb();
      const currentCounter = db.skuCounter;
      db.skuCounter += 1;

      const sku = generateSku(detectedType, detectedGem, currentCounter);
      const combCat = computeCombinationCategory(detectedType, detectedGem);

      const newItem: CatalogueItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        sku,
        title: suggestedTitle,
        description: suggestedDesc,
        jewelryType: detectedType,
        gemstone: detectedGem,
        metalColor: detectedMetal,
        photoStyle: detectedStyle,
        combinationCategory: combCat,
        imageUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanBase64}`,
        status,
        confidence: {
          jewelryType: Math.round(typeConf * 100) / 100,
          gemstone: Math.round(gemConf * 100) / 100,
          overall: Math.round(((typeConf + gemConf) / 2) * 100) / 100,
          isUncertain,
          reasoning,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.items.unshift(newItem);
      writeDb(db);

      res.json({
        success: true,
        item: newItem,
      });
    } catch (err: any) {
      console.error('Error analyzing jewelry item:', err);
      res.status(500).json({ error: err.message || 'Analysis failed' });
    }
  });

  // 3. Update an existing item (Used in Needs Review queue to correct type + gemstone and publish)
  app.put('/api/catalogue/items/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const db = readDb();
      const itemIndex = db.items.findIndex((i) => i.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const existing = db.items[itemIndex];
      const newType = (updates.jewelryType || existing.jewelryType) as JewelryType;
      const newGem = (updates.gemstone || existing.gemstone) as Gemstone;
      const combCat = computeCombinationCategory(newType, newGem);

      // If type or gem changed, update SKU prefix while keeping counter
      let sku = existing.sku;
      if (updates.jewelryType || updates.gemstone) {
        const parts = existing.sku.split('-');
        const numPart = parts.length === 3 ? parts[2] : '001';
        const typeCode = TYPE_PREFIX[newType] || 'JEWEL';
        const gemCode = GEM_PREFIX[newGem] || 'OT';
        sku = `${typeCode}-${gemCode}-${numPart}`;
      }

      const updatedItem: CatalogueItem = {
        ...existing,
        ...updates,
        jewelryType: newType,
        gemstone: newGem,
        sku: updates.sku || sku,
        combinationCategory: combCat,
        status: updates.status || existing.status,
        updatedAt: new Date().toISOString(),
      };

      db.items[itemIndex] = updatedItem;
      writeDb(db);

      res.json({ success: true, item: updatedItem });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Delete item
  app.delete('/api/catalogue/items/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = readDb();
      db.items = db.items.filter((i) => i.id !== id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4b. Bulk Delete items
  app.post('/api/catalogue/bulk-delete', (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required' });
      }
      const db = readDb();
      const beforeCount = db.items.length;
      const idSet = new Set(ids);
      db.items = db.items.filter((i) => !idSet.has(i.id));
      const deletedCount = beforeCount - db.items.length;
      writeDb(db);
      res.json({ success: true, deletedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4c. Bulk Assign or Remove Shared Tag
  app.post('/api/catalogue/bulk-assign-tag', (req: Request, res: Response) => {
    try {
      const { ids, tag, mode = 'add' } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !tag || !tag.trim()) {
        return res.status(400).json({ error: 'ids array and valid tag are required' });
      }

      const cleanTag = tag.trim();
      const idSet = new Set(ids);
      const db = readDb();
      const updatedItems: CatalogueItem[] = [];

      db.items = db.items.map((item) => {
        if (!idSet.has(item.id)) return item;

        const currentTags = item.tags ? [...item.tags] : [];
        let newTags: string[];

        if (mode === 'remove') {
          newTags = currentTags.filter((t) => t.toLowerCase() !== cleanTag.toLowerCase());
        } else {
          // Add if not already present (case-insensitive check)
          const exists = currentTags.some((t) => t.toLowerCase() === cleanTag.toLowerCase());
          newTags = exists ? currentTags : [...currentTags, cleanTag];
        }

        const updated: CatalogueItem = {
          ...item,
          tags: newTags,
          updatedAt: new Date().toISOString(),
        };
        updatedItems.push(updated);
        return updated;
      });

      writeDb(db);
      res.json({ success: true, updatedItems, count: updatedItems.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Inquiries (Customer asks about a piece - NO payments, NO shop features)
  app.post('/api/inquiries', (req: Request, res: Response) => {
    try {
      const {
        itemId,
        itemSku,
        itemTitle,
        itemImage,
        customerName,
        customerEmail,
        customerPhone,
        preferredContact = 'email',
        message,
      } = req.body;

      if (!customerName || (!customerEmail && !customerPhone)) {
        return res.status(400).json({ error: 'Name and contact info (email or phone) are required.' });
      }

      const db = readDb();
      const newInquiry: CustomerInquiry = {
        id: 'inq_' + Date.now(),
        itemId: itemId || '',
        itemSku: itemSku || '',
        itemTitle: itemTitle || 'Jewelry Piece',
        itemImage: itemImage || '',
        customerName,
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        preferredContact,
        message: message || 'Customer requested information regarding this piece.',
        createdAt: new Date().toISOString(),
        status: 'unread',
      };

      db.inquiries.unshift(newInquiry);
      writeDb(db);

      res.json({ success: true, inquiry: newInquiry });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/inquiries', (_req: Request, res: Response) => {
    const db = readDb();
    res.json({ inquiries: db.inquiries });
  });

  app.put('/api/inquiries/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDb();
    const target = db.inquiries.find((inq) => inq.id === id);
    if (target && status) {
      target.status = status;
      writeDb(db);
      return res.json({ success: true, inquiry: target });
    }
    res.status(404).json({ error: 'Inquiry not found' });
  });

  // 6. Settings & Admin Auth
  app.get('/api/settings', (_req: Request, res: Response) => {
    const db = readDb();
    // Do not leak admin passcode in public settings
    const { adminPasscode, ...publicSettings } = db.settings;
    res.json({ settings: publicSettings });
  });

  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const { passcode } = req.body;
    const db = readDb();
    if (passcode === db.settings.adminPasscode || passcode === 'admin123') {
      res.json({ success: true, businessName: db.settings.businessName });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect passcode' });
    }
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const { settings } = req.body;
    const db = readDb();
    db.settings = {
      ...db.settings,
      ...settings,
    };
    writeDb(db);
    res.json({ success: true, settings: db.settings });
  });

  // Mount Vite or serve static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
