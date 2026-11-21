import { OverlaySourceClient } from "@/components/OverlaySourceClient";

export default async function OverlayNestedPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return <OverlaySourceClient type={type} subId={id} />;
}
