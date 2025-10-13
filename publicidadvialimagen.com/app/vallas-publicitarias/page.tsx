import dynamic from "next/dynamic";
import { listSupportsPoints } from "@/lib/data/supports";

const LeafletHybridMap = dynamic(
  () => import("@/components/maps/LeafletHybridMap"),
  { ssr: false }
);

export default async function VallasPublicitariasPage() {
  const points = await listSupportsPoints();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Vallas publicitarias</h1>
      <LeafletHybridMap points={points} />
    </div>
  );
}
