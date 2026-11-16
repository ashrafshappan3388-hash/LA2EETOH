export interface AvatarPreset {
  id: string;
  token: string;
  labelEn: string;
  labelAr: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  glyph: 'falcon' | 'nile' | 'lotus' | 'pyramid' | 'felucca' | 'star';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'falcon',
    token: 'avatar:falcon',
    labelEn: 'Golden Falcon',
    labelAr: 'الصقر الذهبي',
    bgFrom: '#0F172A',
    bgTo: '#1D4ED8',
    accent: '#E2B857',
    glyph: 'falcon',
  },
  {
    id: 'nile',
    token: 'avatar:nile',
    labelEn: 'Nile Crest',
    labelAr: 'شعار النيل',
    bgFrom: '#0369A1',
    bgTo: '#2563EB',
    accent: '#BAE6FD',
    glyph: 'nile',
  },
  {
    id: 'lotus',
    token: 'avatar:lotus',
    labelEn: 'Lotus Blossom',
    labelAr: 'زهرة اللوتس',
    bgFrom: '#4C1D95',
    bgTo: '#7C3AED',
    accent: '#FDE68A',
    glyph: 'lotus',
  },
  {
    id: 'pyramid',
    token: 'avatar:pyramid',
    labelEn: 'Giza Skyline',
    labelAr: 'أهرامات الجيزة',
    bgFrom: '#78350F',
    bgTo: '#D97706',
    accent: '#FEF3C7',
    glyph: 'pyramid',
  },
  {
    id: 'felucca',
    token: 'avatar:felucca',
    labelEn: 'Nile Felucca',
    labelAr: 'فلوكة النيل',
    bgFrom: '#064E3B',
    bgTo: '#059669',
    accent: '#A7F3D0',
    glyph: 'felucca',
  },
  {
    id: 'star',
    token: 'avatar:star',
    labelEn: 'Cairo Star',
    labelAr: 'نجمة القاهرة',
    bgFrom: '#1E1B4B',
    bgTo: '#4338CA',
    accent: '#FBBF24',
    glyph: 'star',
  },
];

export function findAvatarPreset(photoUrl?: string | null): AvatarPreset | null {
  if (!photoUrl || !photoUrl.startsWith('avatar:')) return null;
  return AVATAR_PRESETS.find((p) => p.token === photoUrl) ?? AVATAR_PRESETS[0];
}

export async function compressAvatarFile(file: File, maxDimension = 256, maxLength = 150_000): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, or WebP).');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode selected image.'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable.');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.85;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > maxLength && quality > 0.3) {
      quality -= 0.15;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length > maxLength) {
      throw new Error('Image is still too large after compression. Please pick a smaller image.');
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
