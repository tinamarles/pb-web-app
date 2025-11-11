"use client";

import { useAuth } from "@/app/providers/AuthUserProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AvatarUploader } from "../ui/avatar-uploader";
import { toast } from "sonner";

export default function TestAvatar() {
  const { user } = useAuth();
  const router = useRouter();

  console.log(
    "🎨 TestAvatar rendered. User avatar URL:",
    user?.profilePictureUrl
  );

  // ✅ Step 1: Handle upload (save to backend)
  // Wrap saveAvatar to show user Feedback
  const handleAvatarUpload = async (url: string) => {
    console.log("📸 1. handleAvatarUpload called with URL:", url);
    console.log("⏳ Widget is still open, user needs to click Done...");

    try {
      console.log("📡 2. Sending PATCH request to /api/profile/update...");
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_picture_url: url, // Only sending avatar url
        }),
      });

      console.log("📡 3. Response received:", response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ 4. Error response:", errorData);
        toast.error(`Failed to update avatar: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      console.log("✅ 5. Success! Backend returned:", data);
      console.log("✅ Backend is updated. Waiting for user to close widget...");
    } catch (error) {
      console.error("💥 CATCH: Error in handleAvatarUpload:", error);
      toast.error("An unexpected error occurred");
    }
  };

  // ✅ Step 2: Handle widget close (refresh UI)
  const handleWidgetClose = () => {
    console.log("🎉 6. Widget closed! Now refreshing...");
    toast.success("Avatar updated!");

    console.log("🔄 7. Calling router.refresh()...");
    router.back();

    console.log("✅ 8. Done!");
  };

  return (
    <main className="p-24 flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold my-12">
        Welcome back, {user?.firstName}
      </h1>
      <div className="flex flex-col items-center space-y-4">
        {user?.profilePictureUrl ? (
          <Image
            src={user.profilePictureUrl}
            width={288}
            height={288}
            className="rounded-full"
            alt="Your avatar"
          />
        ) : (
          <div className="bg-gray-300 w-72 h-72 rounded-full" />
        )}
        <div className="flex items-center justify-center gap-x-4">
          <AvatarUploader
            onUploadSuccess={handleAvatarUpload}
            onWidgetClose={handleWidgetClose}
          />
        </div>
      </div>
    </main>
  );
}
