import { getAlliesRanking } from "@/server/actions/allies";
import AlliesRankingClient from "@/components/allies-ranking-client";

export default async function AlliesRanking() {
  const items = await getAlliesRanking(undefined, 8);
  return <AlliesRankingClient items={items as any} />;
}

