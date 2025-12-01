import { getSettings } from "@/server/actions/settings";
import MoodboardPageClient from "@/app/moodboard/MoodboardPageClient";

export default async function MoodboardPage() {
  const settings = await getSettings();
  const images = Array.isArray((settings as any).moodboardHeroUrls)
    ? ((settings as any).moodboardHeroUrls as string[]).filter(Boolean)
    : [];

  return <MoodboardPageClient heroImages={images} />;
}

