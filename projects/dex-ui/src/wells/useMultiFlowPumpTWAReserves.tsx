import useSdk from "src/utils/sdk/useSdk";
import { useWells } from "./useWells";
import { useBeanstalkSiloWhitelist } from "./useBeanstalkSiloWhitelist";

import { multicall } from "@wagmi/core";
import MULTI_PUMP_ABI from "src/abi/MULTI_PUMP_ABI.json";
import { TokenValue } from "@beanstalk/sdk";
import { useQuery } from "@tanstack/react-query";
import { Well } from "@beanstalk/sdk/Wells";
import { useCallback } from "react";
import { config } from "src/utils/wagmi/config";

export const useMultiFlowPumpTWAReserves = () => {
  const { data: wells } = useWells();
  const { getIsMultiPumpWell, getIsWhitelisted } = useBeanstalkSiloWhitelist();
  const sdk = useSdk();

  const query = useQuery({
    queryKey: ["wells", "multiFlowPumpTWAReserves"],

    queryFn: async () => {
      const whitelistedWells = (wells || []).filter((well) => getIsMultiPumpWell(well) && getIsWhitelisted(well) );

      const [{ timestamp: seasonTimestamp }, ...wellOracleSnapshots] = await Promise.all([
        sdk.contracts.beanstalk.time(),
        ...whitelistedWells.map((well) => sdk.contracts.beanstalk.wellOracleSnapshot(well.address))
      ]);

      const calls: any[] = whitelistedWells.reduce<any[]>((prev, well, idx) => {
        well.pumps?.forEach((pump) => {
          prev.push({
            address: pump.address as `0x{string}`,
            abi: MULTI_PUMP_ABI,
            functionName: "readTwaReserves",
            args: [well.address, wellOracleSnapshots[idx], seasonTimestamp.toString(), "0x"]
          });
        });

        return prev;
      }, []);

      const twaReservesResult: any[] = await multicall(config, { contracts: calls });

      const mapping: Record<string, TokenValue[]> = {};

      whitelistedWells.forEach((well) => {
        const twa = [TokenValue.ZERO, TokenValue.ZERO];
        const numPumps = well.pumps?.length || 1;

        well.pumps?.forEach((_pump, index) => {
          const indexedResult = twaReservesResult[index];
          if (indexedResult.error) return;

          const reserves = indexedResult?.result?.[0]
          const token1 = well.tokens?.[0];
          const token2 = well.tokens?.[1];

          if (token1 && token2 && reserves.length === 2 && reserves.length === 2) {
            twa[0] = twa[0].add(TokenValue.fromBlockchain(reserves[0], token1.decimals));
            twa[1] = twa[1].add(TokenValue.fromBlockchain(reserves[1], token2.decimals));
          }
        });

        /// In case there is more than one pump, divide the reserves by the number of pumps
        /// Is this how to handle the case where there is more than one pump?
        mapping[well.address.toLowerCase()] = [twa[0].div(numPumps), twa[1].div(numPumps)];
      });
      return mapping;
    },

    staleTime: 1000 * 60,
    enabled: !!wells?.length,
    refetchOnMount: true
  });

  const getTWAReservesWithWell = useCallback(
    (well: Well | undefined) => {
      if (!well || !query.data) return undefined;

      return query.data[well.address.toLowerCase()];
    },
    [query.data]
  );

  return { ...query, getTWAReservesWithWell };
};
