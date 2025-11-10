import { v2 as cloudinary } from "cloudinary";

// 🔍 DEBUG: Log what's being loaded
console.log("=== CLOUDINARY CONFIG DEBUG ===");
console.log("CLOUD_NAME:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ EXISTS" : "❌ MISSING");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ EXISTS" : "❌ MISSING");
console.log("==============================");

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  // -- start additional checks
  console.log("📤 Sign request received");
   // Additional check
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("❌ Missing Cloudinary credentials in API route!");
    return Response.json(
      { error: "Cloudinary credentials not configured" },
      { status: 500 }
    );
  }
  // -- end of additional checks
  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  console.log("✅ Signature generated successfully");
  return Response.json({ signature });
}
