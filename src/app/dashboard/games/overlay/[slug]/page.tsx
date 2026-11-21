import { DashboardApp } from "@/components/DashboardApp";

export default async function LiveOverlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DashboardApp initialSection="games" initialGame={slug} />;
}
