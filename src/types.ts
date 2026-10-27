export type JewelryType = 'Ring' | 'Necklace' | 'Bracelet' | 'Earring' | 'Other';
export type Gemstone = 'Emerald' | 'Diamond' | 'Sapphire' | 'Ruby' | 'Multi-Gemstone' | 'Other';
export type MetalColor = 'White Gold' | 'Yellow Gold' | 'Rose Gold' | 'Other';
export type PhotoStyle = 'Worn' | 'Held' | 'Detail' | 'Flat';

export interface ConfidenceData {
  jewelryType: number; // 0 to 1
  gemstone: number; // 0 to 1
  overall: number; // 0 to 1
  isUncertain: boolean;
  reasoning: string;
}

export interface CatalogueItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  jewelryType: JewelryType;
  gemstone: Gemstone;
  metalColor: MetalColor;
  photoStyle: PhotoStyle;
  combinationCategory: string; // e.g., "Diamond Bracelets", "Emerald Rings"
  tags?: string[]; // e.g., ["High Jewelry", "Bridal", "New Arrival"]
  imageUrl: string;
  additionalImages?: string[];
  status: 'published' | 'needs_review';
  confidence: ConfidenceData;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInquiry {
  id: string;
  itemId: string;
  itemSku: string;
  itemTitle: string;
  itemImage?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  preferredContact: 'email' | 'phone' | 'either';
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}

export interface AppSettings {
  businessName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  inquiryPromptText: string;
  adminPasscode: string;
}

export interface BatchUploadProgress {
  total: number;
  uploaded: number;
  processing: number;
  done: number;
  failed: number;
  autoPublished: number;
  needsReview: number;
}
