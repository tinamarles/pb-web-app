"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormField, Button, Icon } from "@/app/ui";
import { useAuth } from "@/app/providers/AuthUserProvider";
import { toast } from "sonner";


// === MODIFICATION LOG ===
// Date: 2025-11-18 UTC
// Modified by: Assistant
// Changes: Extracted ProfileForm from /pages/profile.tsx (lines 94-231)
// Purpose: Create reusable form component for both /profile and /setup pages
// Follows DRY principle, allows form to be used in multiple contexts
// ========================
//
// === MODIFICATION LOG ===
// Date: 2025-11-18
// Modified by: Assistant
// Changes: Fixed skillLevel type - changed from number to string in ProfileFormData
// Previous: skillLevel: number caused TypeScript errors (form inputs are strings)
// New: skillLevel stored as string in formData, converted to number on save
// Purpose: Follow standard React form pattern - keep form data as strings, convert on submit
// ========================
//
// === MODIFICATION LOG ===
// Date: 2025-11-18
// Modified by: Assistant
// Changes: Cleaned up callback pattern - Smart Component approach
// Previous: onSave called before save, duplicate data conversion, confusing flow
// New:
//   - ProfileForm handles ALL save logic (conversion + API call) in ONE place
//   - onSaveSuccess called AFTER successful save (no false promises!)
//   - onSaveError for error handling (optional)
//   - Parent just gets notified, does custom stuff (redirect, analytics, etc.)
// Benefits: No duplicate work, clear responsibilities, works standalone
// ========================

export interface ProfileFormProps {
  mode?: "view" | "setup";
  onSaveSuccess?: () => void; // Called AFTER successful save
  onSaveError?: (error: Error) => void; // Called on error (optional)
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  location: string;
  phoneNumber: string;
  skillLevel: string; // ← STRING in form (converted to number on save)
  isCertifiedInstructor: boolean;
  bio: string;
  hasPrivacy: boolean;
}

export function ProfileForm({
  mode = "view",
  onSaveSuccess,
  onSaveError,
}: ProfileFormProps) {

  const { user } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  

  // Form state - initialize with user data
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    dateOfBirth: user?.dob || "",
    gender:
      user?.gender === 1 ? "Male" : user?.gender === 2 ? "Female" : "Other",
    location: "St. Jerôme, QC", // TODO: Get from user address
    phoneNumber: user?.mobilePhone || "",
    skillLevel: user?.skillLevel ? String(user.skillLevel) : "", // ← Convert number to string
    isCertifiedInstructor: user?.isCoach || false,
    bio: user?.bio || "",
    hasPrivacy: false,
  });

  // Sync formData with user data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        dateOfBirth: user.dob || '',
        gender: user.gender === 1 ? 'Male' : user.gender === 2 ? 'Female' : 'Other',
        location: 'St. Jerôme, QC', // TODO: Get from user address
        phoneNumber: user.mobilePhone || '',
        skillLevel: user.skillLevel ? String(user.skillLevel) : '',  // ← Convert number to string
        isCertifiedInstructor: user.isCoach || false,
        bio: user.bio || '',
        hasPrivacy: false,
      });
    }
  }, [user]);

  // Handle form field changes
  const handleChange = (
    field: keyof ProfileFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    alert('Clicked Edit');
  }

  // Convert form data to API format (string → number conversions)
  const prepareDataForAPI = (data: ProfileFormData) => {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dob: data.dateOfBirth,
      gender: data.gender === "Male" ? 1 : data.gender === "Female" ? 2 : 3,
      mobilePhone: data.phoneNumber,
      skillLevel: parseFloat(data.skillLevel) || 0, // ← STRING to NUMBER
      isCoach: data.isCertifiedInstructor,
      bio: data.bio,
      // Add other fields as needed (address, etc.)
    };
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);

    // 1. Convert form data to API format (ONCE, here only)
    const apiData = prepareDataForAPI(formData);

    console.log("Saving profile...");
    console.log("Form data (strings):", formData);
    console.log("API data (converted):", apiData);

    try {
      // 2. Call API to save profile changes (ONCE, here only)
      // TODO: Replace with actual API endpoint when backend is ready
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result = await response.json();
      console.log("Profile saved successfully:", result);

      // 3. ✅ SUCCESS! Show feedback
      toast.success("Profile updated successfully!");

      if (mode === 'setup') {
        router.push('/dashboard/public');
      }

      // 4. Notify parent AFTER successful save (no false promises!)
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      // 5. ❌ ERROR! Handle it
      console.error("Profile save error:", error);
      toast.error("Failed to update profile. Please try again.");

      // Notify parent of error (if they want to handle it)
      if (onSaveError) {
        onSaveError(error as Error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page__form">
      <h2 className="title-lg emphasized mb-lg">Personal Details</h2>

      <div className="profile-page__form__grid">
        <div className="profile-page__mobile__list-item">
          <FormField
            label="First Name"
            type="text"
            value={formData.firstName}
            onChange={(value) => handleChange("firstName", value)}
            placeholder="Your first Name"
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          <FormField
            label="Last Name"
            type="text"
            value={formData.lastName}
            onChange={(value) => handleChange("lastName", value)}
            placeholder="Your last Name"
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          <FormField
            label="Phone Number"
            sublabel="(Optional)"
            type="tel"
            icon="phone"
            value={formData.phoneNumber}
            onChange={(value) => handleChange("phoneNumber", value)}
            placeholder="Placeholder"
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          <FormField
            label="Location"
            sublabel="(Optional)"
            type="text"
            icon="location"
            value={formData.location}
            onChange={(value) => handleChange("location", value)}
            placeholder="Your city"
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          <FormField
            label="Date of Birth"
            sublabel="(Optional)"
            type="date"
            icon="calendar"
            value={formData.dateOfBirth}
            onChange={(value) => handleChange("dateOfBirth", value)}
            placeholder="yyyy/mm/dd"
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          <FormField
            label="Gender"
            sublabel="(Optional)"
            variant="select"
            value={formData.gender}
            onChange={(value) => handleChange("gender", value)}
            placeholder="Placeholder"
            options={["Male", "Female", "Other"]}
            hideChevronOnMobile
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          <FormField
            label="Skill Level"
            sublabel="(Level 1.0 to 7.0)"
            type="text"
            value={formData.skillLevel}
            onChange={(value) => handleChange("skillLevel", value)}
            placeholder="Your skill level"
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item">
          {/* Certified Instructor Checkbox */}
          <FormField
            variant="checkbox"
            icon='coaches'
            label="Certification" // Shows at TOP (aligns with grid)
            placeholder="Certified Instructor" // Shows INSIDE the box
            checked={formData.isCertifiedInstructor}
            onChange={(checked) =>
              handleChange("isCertifiedInstructor", checked)
            }
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
        <div className="profile-page__mobile__list-item form-field--bio">
          {/* Bio - Full Width */}
          <FormField
            label="Bio"
            type="textarea"
            value={formData.bio}
            onChange={(value) => handleChange("bio", value)}
            placeholder="Tell us about yourself"
            textareaClassName=""
            className=""
          />
          <button className="profile-page__formField__button">
            <Icon name="edit" className="icon-md" />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="profile-page__form__button">
        <Button
          variant="filled"
          size="lg"
          label="Save Changes"
          onClick={handleSave}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}
