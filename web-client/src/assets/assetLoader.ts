export type AssetManifest = {
  version: string;
  generated?: boolean;
  assets: Record<string, Record<string, string[]>>;
};

async function fetchJSON<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export async function loadManifest(): Promise<AssetManifest> {
  return fetchJSON<AssetManifest>("/assets/manifest.json");
}

export async function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image ${path}`));
    img.src = path;
  });
}

export async function loadAvatarParts(): Promise<
  Record<string, HTMLImageElement[]>
  > {
  const manifest = await loadManifest();
  const avatar = manifest.assets?.avatar || {};
  const result: Record<string, HTMLImageElement[]> = {};
  for (const part of Object.keys(avatar)) {
    const paths = avatar[part] || [];
    result[part] = await Promise.all(paths.map((p) => loadImage(p)));
  }
  return result;
}

export default { loadManifest, loadImage, loadAvatarParts };
