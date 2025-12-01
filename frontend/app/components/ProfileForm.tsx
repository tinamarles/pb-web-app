"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormField, Button, Sheet} from "@/app/ui";
import { useAuth } from "@/app/providers/AuthUserProvider";
import { toast } from "sonner";
import { FORM_FIELDS, FormFieldConfig } from "../data/formFieldConfig";

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
}

// ✅ FIELD CONFIGURATIONS - Function that receives mode for conditional props
// Ensures consistency across all forms - firstName always looks the same everywhere
// Mode-specific overrides: hideChevronOnMobile only in 'view' mode, show chevron in 'setup'
const getFieldConfigs = (mode: 'view' | 'setup'): Record<keyof ProfileFormData, FormFieldConfig> => ({
  firstName: FORM_FIELDS.firstName,
  lastName: FORM_FIELDS.lastName,
  phoneNumber: FORM_FIELDS.phoneNumber,
  location: FORM_FIELDS.location,
  dateOfBirth: FORM_FIELDS.dateOfBirth,
  // Override hideChevronOnMobile based on mode - only hide in 'view' mode
  gender: { ...FORM_FIELDS.gender, hideChevronOnMobile: mode === 'view' },
  skillLevel: FORM_FIELDS.skillLevel,
  isCertifiedInstructor: FORM_FIELDS.isCertifiedInstructor,
  bio: FORM_FIELDS.bio,
  email: FORM_FIELDS.email
});

export function ProfileForm({
  mode,
  onSaveSuccess,
  onSaveError,
}: ProfileFormProps) {

  const { user } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  // Get field configs based on current mode (for conditional props like hideChevronOnMobile)
  const fieldConfigs = getFieldConfigs(mode || 'view');

  // Mobile edit sheet state - tracks which field is being edited
  const [editingField, setEditingField] = useState<keyof ProfileFormData | null>(null);
  
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

  // Convert form data to API format (string → number conversions)
  const prepareDataForAPI = (data: ProfileFormData) => {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dob: data.dateOfBirth || null,
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
    console.log("current User: ", user);

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
        console.error("❌ Response status:", response.status);
        console.error("❌ Response statusText:", response.statusText);
        
        // Try to get error as JSON
        let errorMessage = "ProfileForm: Failed to update profile";
        try {
          const errorData = await response.json();
          console.error("❌ Error data (JSON):", errorData);
          errorMessage = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          // Not JSON, try as text
          const errorText = await response.text();
          console.error("❌ Error data (TEXT):", errorText);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
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

  // Handle save from sheet - saves and closes sheet
  const handleSaveAndClose = async () => {
    await handleSave();
    setEditingField(null);  // Close sheet after save
  };

  // ✅ DYNAMIC FIELD RENDERER - Spreads static config + adds dynamic state
  const renderField = (fieldKey: keyof ProfileFormData) => {
    const config = fieldConfigs[fieldKey];
    
    return (
      <>
        <FormField
          {...config}  // ← Spread static config (label, variant, type, icon, etc.)
          value={formData[fieldKey] as string}  // ← Dynamic: current value from state
          checked={formData[fieldKey] as boolean}  // ← Dynamic: current checked state (ignored by non-checkbox/toggle)
          onChange={(val:string | boolean) => handleChange(fieldKey, val)}  // ← Dynamic: updates state
        />
        <Button 
          variant='subtle'
          icon='edit'
          iconOnly
          className="profile-page__mobile-item__button"
          onClick={() => setEditingField(fieldKey)}
        />
      </>
    );
  };

  // ✅ DYNAMIC SHEET RENDERER - Generic sheet for any field
  const renderSheet = (fieldKey: keyof ProfileFormData) => {
    const config = fieldConfigs[fieldKey];
    
    return (
      <Sheet
        open={editingField === fieldKey}
        onOpenChange={(open) => !open && setEditingField(null)}
        title={config.sheetTitle}
      >
        {renderField(fieldKey)}
        <div className="flex gap-3 mt-6">
          <Button
            variant="filled"
            size="lg"
            label="Save"
            onClick={handleSaveAndClose}
            disabled={isSaving}
            className="flex-1"
          />
          <Button
            variant="outlined"
            size="lg"
            label="Cancel"
            onClick={() => setEditingField(null)}
            className="flex-1"
          />
        </div>
      </Sheet>
    );
  };

  return (
    <div className="page__form" data-mode={mode}>
      <h2 className="title-lg emphasized mb-lg">Personal Details</h2>

      <div className="grid-3">
        {/* First Name */}
        <div className="profile-page__mobile-item">
          {renderField('firstName')}
        </div>

        {/* Last Name */}
        <div className="profile-page__mobile-item">
          {renderField('lastName')}
        </div>

        {/* Phone Number */}
        <div className="profile-page__mobile-item">
          {renderField('phoneNumber')}
        </div>

        {/* Location */}
        <div className="profile-page__mobile-item">
          {renderField('location')}
        </div>

        {/* Date of Birth */}
        <div className="profile-page__mobile-item">
          {renderField('dateOfBirth')}
        </div>

        {/* Gender */}
        <div className="profile-page__mobile-item">
          {renderField('gender')}
        </div>

        {/* Skill Level */}
        <div className="profile-page__mobile-item">
          {renderField('skillLevel')}
        </div>

        {/* Certified Instructor */}
        <div className="profile-page__mobile-item">
          {renderField('isCertifiedInstructor')}
        </div>

        {/* Bio - Full Width */}
        <div className="profile-page__mobile-item grid--textarea">
          {renderField('bio')}
        </div>
      </div>

      {/* Save Button */}
      <div className="page__form__button">
        <Button
          variant="filled"
          size="lg"
          label="Save Changes"
          onClick={handleSave}
          disabled={isSaving}
        />
      </div>

      {/* ===== MOBILE EDIT SHEETS ===== */}
      {/* NEXT.JS: No changes needed - works identically */}
      
      {renderSheet('firstName')}
      {renderSheet('lastName')}
      {renderSheet('phoneNumber')}
      {renderSheet('location')}
      {renderSheet('dateOfBirth')}
      {renderSheet('gender')}
      {renderSheet('skillLevel')}
      {renderSheet('isCertifiedInstructor')}
      {renderSheet('bio')}

    </div>
  );
}
