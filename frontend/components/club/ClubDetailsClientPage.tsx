"use client";
import { PlaceholderPage } from "../PlaceholderPage";

type ClubDetailsClientPageProps = {
  clubId: string;
};

export function ClubDetailsClientPage({ clubId }: ClubDetailsClientPageProps) {
  return (
    <>
      <h1 className="title-lg text-secondary">Club Details - ID: {clubId}</h1>
      <PlaceholderPage />
    </>
  );
}
