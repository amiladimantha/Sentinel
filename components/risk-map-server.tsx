import { getDistrictRisks } from "@/lib/api/district-risk";
import { RiskMap } from "@/components/risk-map";
import geoData from "@/data/sri-lanka-districts.json";

export async function RiskMapServer() {
  const risks = await getDistrictRisks();

  return <RiskMap risks={risks} geoData={geoData} />;
}
