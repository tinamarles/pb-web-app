"use client";

import { useAuth } from "@/app/providers/AuthUserProvider";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { AvatarUploader } from "../ui/avatar-uploader";

export default function TestAvatar() {
  const { user } = useAuth();

  async function saveAvatar(url: string) {
    "use server";
    console.log("image url:", url);
    revalidatePath("/");
  }

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
          <AvatarUploader onUploadSuccess={saveAvatar} />
        </div>
      </div>
    </main>
  );
}
