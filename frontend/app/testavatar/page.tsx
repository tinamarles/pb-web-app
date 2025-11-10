"use client";

import { useAuth } from "@/app/providers/AuthUserProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveAvatar } from "../lib/saveAvatar";
import { AvatarUploader } from "../ui/avatar-uploader";
import { toast } from 'sonner';

export default function TestAvatar() {
  const { user } = useAuth();
  const router = useRouter();

  // Wrap saveAvatar to show user Feedback
  const handleAvatarUpload = async (url: string) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify ({
          profile_picture_url: url // Only sending avatar url
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to update avatar: ${errorData.error}`);
        return;
      }

      toast.success('Avatar updated successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('An unexpected error occurred');
    }
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
          <AvatarUploader onUploadSuccess={handleAvatarUpload} />
        </div>
      </div>
    </main>
  );
}
