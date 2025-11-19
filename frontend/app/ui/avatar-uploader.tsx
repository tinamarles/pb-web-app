// components/avatar-uploader.tsx
"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useRef } from "react";
import { MenuItem } from "@/app/ui";

interface AvatarUploaderProps {
  onUploadSuccess: (url: string) => void;
  onWidgetClose?: () => void; // NEW: called when widget closes
}

export function AvatarUploader({ onUploadSuccess, onWidgetClose }: AvatarUploaderProps) {
  const uploadedRef = useRef(false); // Track if upload happened

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      // signatureEndpoint="/api/sign-cloudinary-params"
      onSuccess={(result) => {
        console.log('☁️ Cloudinary onSuccess fired');
        if (typeof result.info === "object" && "secure_url" in result.info) {
          uploadedRef.current = true; // Mark that we uploaded
          onUploadSuccess(result.info.secure_url);
        }
      }}

      onClose={() => {
        console.log('☁️ Cloudinary widget closed');
        // Only trigger close callback if an upload actually happened
        if (uploadedRef.current && onWidgetClose) {
          onWidgetClose();
          uploadedRef.current = false;  // Reset for next time
        }
      }}

      options={{
        singleUploadAutoClose: false,
      }}
    >
      {({ open }) => {
        return (
          <MenuItem 
            label="Upload Image" 
            icon="upload" 
            iconBordered={false}
            onClick={() => open()} 
          />
        );
      }}
    </CldUploadWidget>
  );
}
