function getCloudinaryEnv() {
  const env = process.env;
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

export function checkCloudinaryEnv() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
  ].filter(Boolean);
  
  if (missing.length) {
    throw new Error(`Cloudinary is not configured. Missing: ${missing.join(", ")}`);
  }
}

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadImageToCloudinary(file: File | Blob, folder: string): Promise<string> {
  const env = getCloudinaryEnv();
  checkCloudinaryEnv();

  const cloudName = env.cloudName!;
  const apiKey = env.apiKey!;
  const apiSecret = env.apiSecret!;
  
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  // Signature requires sorting params alphabetically: folder, timestamp
  const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1(strToSign);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudinary Upload Failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

export async function deleteImageFromCloudinary(url: string): Promise<void> {
  try {
    const env = getCloudinaryEnv();
    checkCloudinaryEnv();

    const cloudName = env.cloudName!;
    const apiKey = env.apiKey!;
    const apiSecret = env.apiSecret!;

    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+$/i);
    if (!match) return;
    const publicId = match[1];

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const strToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1(strToSign);

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    });
  } catch (e) {
    console.error("[storage] Failed to delete image from Cloudinary:", e);
  }
}
