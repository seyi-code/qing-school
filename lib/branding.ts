/**
 * Resolve display branding for the current school (white-label).
 * Falls back to KMS defaults in school-config when no School row.
 * Design presets (classic / montessori / modern) fill colours when DB fields are empty.
 */
import { prisma } from "@/lib/db";
import { SCHOOL } from "@/lib/school-config";
import { presetForSlug } from "@/lib/school-presets";

export type Branding = {
  name: string;
  shortName: string;
  motto: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  phone: string;
  phoneAlt?: string;
  email: string;
  address: string;
  /** Public layout preset id */
  layoutPreset?: "classic" | "montessori" | "modern";
  socialFacebook?: string;
  socialInstagram?: string;
  socialYoutube?: string;
};

export function defaultBranding(): Branding {
  const p = presetForSlug("kms");
  return {
    name: SCHOOL.name,
    shortName: SCHOOL.shortName,
    motto: SCHOOL.motto,
    logoUrl: "/logo.svg",
    primaryColor: SCHOOL.colors.primary,
    accentColor: SCHOOL.colors.gold,
    phone: SCHOOL.contact.phone,
    phoneAlt: SCHOOL.contact.phoneAlt,
    email: SCHOOL.contact.email,
    address: SCHOOL.contact.address,
    layoutPreset: p.id,
    socialFacebook: SCHOOL.social.facebook,
    socialInstagram: SCHOOL.social.instagram,
    socialYoutube: SCHOOL.social.youtube,
  };
}

export async function getBrandingForSchoolId(schoolId: string | null | undefined): Promise<Branding> {
  if (!schoolId) return defaultBranding();
  const s = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!s) return defaultBranding();
  const preset = presetForSlug(s.slug);
  const isKms = (s.slug || "").toLowerCase() === "kms";
  return {
    name: s.name || SCHOOL.name,
    shortName: s.shortName || SCHOOL.shortName,
    motto: s.motto || SCHOOL.motto,
    logoUrl: s.logoUrl || "/logo.svg",
    primaryColor: s.primaryColor || preset.primary,
    accentColor: s.accentColor || preset.accent,
    phone: s.phone || SCHOOL.contact.phone,
    phoneAlt: s.phoneAlt || SCHOOL.contact.phoneAlt,
    email: s.email || SCHOOL.contact.email,
    address: s.address || SCHOOL.contact.address,
    layoutPreset: preset.id,
    // Non-KMS: omit KMS social defaults until school sets its own
    socialFacebook: isKms ? SCHOOL.social.facebook : undefined,
    socialInstagram: isKms ? SCHOOL.social.instagram : undefined,
    socialYoutube: isKms ? SCHOOL.social.youtube : undefined,
  };
}
