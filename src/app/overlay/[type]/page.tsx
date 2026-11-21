import { OverlaySourceClient } from "@/components/OverlaySourceClient";

export default async function OverlaySinglePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return <OverlaySourceClient type={type} />;
}
