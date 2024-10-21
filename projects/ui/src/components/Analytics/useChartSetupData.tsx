import React, { useMemo } from 'react';


import useSdk from '~/hooks/sdk';
import { formatUnits } from 'viem';
import {
  BEAN,
  BEAN_CRV3_LP,
  BEAN_CRV3_V1_LP,
  BEAN_ETH_UNIV2_LP,
  BEAN_ETH_WELL_LP,
  BEAN_LUSD_LP,
  BEAN_USDC_WELL_LP,
  BEAN_USDT_WELL_LP,
  BEAN_WBTC_WELL_LP,
  BEAN_WEETH_WELL_LP,
  BEAN_WSTETH_WELL_LP,
  UNRIPE_BEAN,
  UNRIPE_BEAN_WSTETH,
} from '~/constants/tokens';
import { Typography } from '@mui/material';
import { SupportedChainId } from '~/constants';
import { getMultiChainToken, TokenInstance } from '~/hooks/beanstalk/useTokens';
import {
  SGQueryParameters,
  subgraphQueryConfigs,
  subgraphQueryKeys,
} from '~/util/Graph';
import {
  tickFormatBeanAmount,
  tickFormatBeanPrice,
  tickFormatPercentage,
  tickFormatTruncated,
  tickFormatUSD,
  valueFormatBeanAmount,
} from './formatters';

interface ChartSetupBase extends SGQueryParameters {
  /**
   * Name of this chart. Mainly used in the Select Dialog and the chips that show which charts
   * are currently selected, therefore ideally it should be short and to the point.
   */
  name: string;
  /**
   * Title shown in the actual chart after the user
   * makes their selection.
   */
  tooltipTitle: string;
  /**
   * Text description shown when user hovers the tooltip icon next to the tooltip title.
   */
  tooltipHoverText: string | JSX.Element;
  /**
   * Short description shown in the Select Dialog.
   */
  shortDescription: string;
  /**
   * Short identifier for the output of this chart. Lightweight Charts only supports
   * two price scales, so we use this to group charts that have similar
   * outputs in the same price scale.
   */
  valueAxisType: string;
  /**
   * Formats the raw output from the query into a number for Lightweight Charts.
   */
  valueFormatter: 
    ((v: string) => number | undefined) | 
    ((v: string) => (chain: "l1" | "l2") => number | undefined);
  /**
   *
   */
  dataFormatter?: (v: any) => any;
  /**
   * Formats the number used by Lightweight Charts into a string that's shown at the top
   * of the chart.
   */
  tickFormatter: (v: number) => string | undefined;
  /**
   * Formats the number used by Lightweight Charts into a string for the
   * price scales.
   */
  shortTickFormatter: (v: number) => string | undefined;
}

type ChartSetup = ChartSetupBase & {
  /**
   * Used in the "Bean/Field/Silo" buttons in the Select Dialog to allow
   * the user to quickly filter the available charts.
   */
  type: string;
  /**
   * Id of this chart in the chart data array.
   */
  index: number;
};

function getFetchTypeWithToken(
  _token: TokenInstance
): ChartSetupBase['fetchType'] {
  const token = getMultiChainToken(_token.address);
  let fetchType: ChartSetupBase['fetchType'] = 'both';

  if (!token.l2) {
    fetchType = 'l1-only';
  }
  if (!token.l1) {
    fetchType = 'l2-only';
  }
  return fetchType;
}

// L2 ONLY
const depositedTokensToChart = [
  BEAN[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_ETH_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_WSTETH_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_WBTC_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_WEETH_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_USDC_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_USDT_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  UNRIPE_BEAN[SupportedChainId.ARBITRUM_MAINNET],
  UNRIPE_BEAN_WSTETH[SupportedChainId.ARBITRUM_MAINNET],
];

const lpTokensToChart = [
  BEAN_CRV3_LP[1],
  BEAN_ETH_WELL_LP[1],
  BEAN_WSTETH_WELL_LP[1],
  BEAN_CRV3_LP[SupportedChainId.ETH_MAINNET],
  BEAN_WBTC_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_WEETH_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_USDC_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_USDT_WELL_LP[SupportedChainId.ARBITRUM_MAINNET],
  BEAN_ETH_UNIV2_LP[1],
  BEAN_LUSD_LP[1],
  BEAN_CRV3_V1_LP[1],
];

// prettier-ignore
export function useChartSetupData() {
  const sdk = useSdk();

  return useMemo(() => {
    const stalk = sdk.tokens.STALK;

    const lpCharts: ChartSetupBase[] = [];
    const depositCharts: ChartSetupBase[] = [];
    const apyCharts: ChartSetupBase[] = [];

    depositedTokensToChart.forEach((token) => {
      const depositedConfig = subgraphQueryConfigs.depositedSiloToken(token);
      const depositedChart: ChartSetupBase = {
        id: depositedConfig.queryKey,
        name: `Deposited ${token.symbol}`,
        tooltipTitle: `Total Deposited ${token.symbol}`,
        tooltipHoverText: `The total number of Deposited ${token.symbol === 'BEAN' ? 'Beans' : token.symbol === 'urBEAN' ? 'Unripe Beans' : `${token.name}`} at the beginning of every Season.`,
        shortDescription: `The total number of Deposited ${token.symbol === 'BEAN' ? 'Beans.' : token.symbol === 'urBEAN' ? 'Unripe Beans.' : `${token.name}.`}`,
        timeScaleKey: 'createdAt',
        priceScaleKey: 'depositedAmount',
        valueAxisType: token.isUnripe ? 'depositedUnripeAmount' : 'depositedAmount',
        document: depositedConfig.document,
        documentEntity: 'seasons',
        fetchType: getFetchTypeWithToken(token),
        queryConfig: depositedConfig.queryOptions,
        valueFormatter: (value: any) => Number(formatUnits(value, token.decimals)),
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatTruncated,
      };
      const apyConfig = subgraphQueryConfigs.siloToken30DvAPY(token);
      const apyChart: ChartSetupBase = {
        id: apyConfig.queryKey,
        name: `${token.symbol} 30D vAPY`,
        tooltipTitle: `${token.symbol} 30D vAPY`,
        tooltipHoverText: `The Variable Bean APY uses a moving average of Beans earned by Stalkholders during recent Seasons to estimate a future rate of return, accounting for Stalk growth.`,
        shortDescription: 'Average Beans earned by Stalkholders during recent Seasons estimate a future rate of return.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'beanAPY',
        valueAxisType: 'apy',
        document: apyConfig.document,
        documentEntity: 'seasons',
        fetchType: getFetchTypeWithToken(token),
        queryConfig: apyConfig.queryOptions,
        valueFormatter: (v: string) => Number(v) * 100,
        tickFormatter: tickFormatPercentage,
        shortTickFormatter: tickFormatPercentage,
      };

      depositCharts.push(depositedChart);
      apyCharts.push(apyChart);
    });

    lpTokensToChart.forEach((token) => {
      const tokenSymbol = token.symbol;
      const apyConfig = subgraphQueryConfigs.tokenLiquidity(token);
      const lpChart: ChartSetupBase = {
        id: apyConfig.queryKey,
        name: `${tokenSymbol} Liquidity`,
        tooltipTitle: `${tokenSymbol} Liquidity`,
        tooltipHoverText: `The total USD value of ${tokenSymbol} in liquidity pools on the Minting Whitelist.`,
        shortDescription: `${tokenSymbol} Liquidity.`,
        timeScaleKey: 'updatedAt',
        priceScaleKey: 'liquidityUSD',
        document: apyConfig.document,
        documentEntity: 'seasons',
        valueAxisType: 'usdLiquidity',
        fetchType: getFetchTypeWithToken(token),
        queryConfig: apyConfig.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatUSD,
        shortTickFormatter: tickFormatUSD,
      };

      lpCharts.push(lpChart);
    });

    const output: ChartSetup[] = [];
    let dataIndex = 0;

    const beanCharts: ChartSetupBase[] = [
      {
        id: subgraphQueryKeys.priceInstantBEAN,
        name: 'Bean Price',
        tooltipTitle: 'Current Bean Price',
        tooltipHoverText: 'The Current Price of Bean in USD',
        shortDescription: 'The USD price of 1 Bean.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'price',
        document: subgraphQueryConfigs.priceInstantBEAN.document,
        documentEntity: 'seasons',
        valueAxisType: 'BEAN_price',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.priceInstantBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatBeanPrice,
        shortTickFormatter: tickFormatBeanPrice,
      },
      {
        id: subgraphQueryConfigs.volumeBEAN.queryKey,
        name: 'Volume',
        tooltipTitle: 'Volume',
        tooltipHoverText:
          'The total USD volume in liquidity pools on the Minting Whitelist.',
        shortDescription: 'The total USD volume in liquidity pools.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'deltaVolumeUSD',
        document: subgraphQueryConfigs.volumeBEAN.document,
        documentEntity: 'seasons',
        valueAxisType: 'volume',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.volumeBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatUSD,
        shortTickFormatter: tickFormatUSD,
      },
      {
        id: subgraphQueryConfigs.totalLiquidityBEAN.queryKey,
        name: 'Total Liquidity',
        tooltipTitle: 'Liquidity',
        tooltipHoverText:
          'The total USD value of tokens in liquidity pools on the Minting Whitelist at the beginning of every Season. Pre-exploit values include liquidity in pools on the Deposit Whitelist.',
        shortDescription:
          'The total USD value of tokens in liquidity pools on the Minting Whitelist.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'liquidityUSD',
        document: subgraphQueryConfigs.totalLiquidityBEAN.document,
        documentEntity: 'seasons',
        valueAxisType: 'usdLiquidity',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.totalLiquidityBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatUSD,
        shortTickFormatter: tickFormatUSD,
      },
      ...lpCharts,
      {
        id: subgraphQueryConfigs.marketCapBEAN.queryKey,
        name: 'Market Cap',
        tooltipTitle: 'Market Cap',
        tooltipHoverText:
          'The USD value of the Bean supply at the beginning of every Season.',
        shortDescription: 'The USD value of the Bean supply.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'marketCap',
        valueAxisType: 'marketCap',
        document: subgraphQueryConfigs.marketCapBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.marketCapBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatUSD,
        shortTickFormatter: tickFormatUSD,
      },
      {
        id: subgraphQueryConfigs.supplyBEAN.queryKey,
        name: 'Supply',
        tooltipTitle: 'Bean Supply',
        tooltipHoverText:
          'The total Bean supply at the beginning of every Season.',
        shortDescription: 'The total Bean supply.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'beans',
        valueAxisType: 'BEAN_amount',
        document: subgraphQueryConfigs.supplyBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.supplyBEAN.queryOptions,
        valueFormatter: valueFormatBeanAmount,
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatTruncated,
      },
      {
        id: subgraphQueryConfigs.crossesBEAN.queryKey,
        name: 'Crosses',
        tooltipTitle: 'Peg Crosses',
        tooltipHoverText:
          'The total number of times Bean has crossed its peg at the beginning of every Season.',
        shortDescription: 'The total number of times Bean has crossed its peg.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'crosses',
        valueAxisType: 'pegCrosses',
        document: subgraphQueryConfigs.crossesBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.crossesBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatBeanAmount,
      },
      {
        id: subgraphQueryConfigs.instantaneousDeltaBBEAN.queryKey,
        name: 'Inst. deltaB',
        tooltipTitle: 'Cumulative Instantaneous deltaB',
        tooltipHoverText:
          'The cumulative instantaneous shortage of Beans in liquidity pools on the Minting Whitelist at the beginning of every Season. Pre-exploit values include the instantaneous deltaB in all pools on the Deposit Whitelist.',
        shortDescription:
          'The cumulative instantaneous shortage of Beans in liquidity pools on the Minting Whitelist.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'instantaneousDeltaB',
        valueAxisType: 'deltaB',
        document: subgraphQueryConfigs.instantaneousDeltaBBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.instantaneousDeltaBBEAN.queryOptions,
        valueFormatter: valueFormatBeanAmount,
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatBeanAmount,
      },
      {
        id: subgraphQueryConfigs.twaDeltaBBEAN.queryKey,
        name: 'TWA deltaB',
        tooltipTitle: 'Cumulative TWA deltaB',
        tooltipHoverText:
          'The cumulative liquidity and time weighted average shortage of Beans in liquidity pools on the Minting Whitelist at the beginning of every Season. Values during liquidity migrations are omitted. Pre-exploit values include the TWA deltaB in all pools on the Deposit Whitelist.',
        shortDescription:
          'The time weighted average shortage of Beans in liquidity pools on the Minting Whitelist.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'twaDeltaB',
        valueAxisType: 'deltaB',
        document: subgraphQueryConfigs.twaDeltaBBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.twaDeltaBBEAN.queryOptions,
        valueFormatter: valueFormatBeanAmount,
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatBeanAmount,
      },
      {
        id: subgraphQueryConfigs.twaPriceBEAN.queryKey,
        name: 'TWA Bean Price',
        tooltipTitle: 'TWA Bean Price',
        tooltipHoverText:
          'The cumulative liquidity and time weighted average USD price of 1 Bean at the beginning of every Season. Values during liquidity migrations are omitted. Pre-exploit values include the TWA price in all pools on the Deposit Whitelist.',
        shortDescription:
          'The cumulative liquidity and time weighted average USD price of 1 Bean.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'twaPrice',
        valueAxisType: 'BEAN_price',
        document: subgraphQueryConfigs.twaPriceBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.twaPriceBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatBeanPrice,
        shortTickFormatter: tickFormatBeanPrice,
      },
      {
        id: subgraphQueryConfigs.l2srBEAN.queryKey,
        name: 'Liquidity to Supply Ratio',
        tooltipTitle: 'Liquidity to Supply Ratio',
        tooltipHoverText: (
          <Typography component="span">
            <Typography component="span">
              The Liquidity to Supply Ratio (L2SR) represents the Beanstalk
              liquidity level relative to the Bean supply. The L2SR is a useful
              indicator of Beanstalk&apos;s health.
            </Typography>
            <Typography component="ul">
              <Typography component="li" ml={-2} mt={1}>
                Liquidity is defined as the sum of the USD values of the
                non-Bean assets in each whitelisted liquidity pool multiplied by
                their respective liquidity weights.
              </Typography>
              <Typography component="li" ml={-2} mt={1}>
                Supply is defined as the total Bean supply minus Locked Beans.
              </Typography>
              <Typography component="li" ml={-2} mt={1}>
                Pre-exploit values include liquidity in pools on the Deposit
                Whitelist.
              </Typography>
            </Typography>
          </Typography>
        ),
        shortDescription:
          'The ratio of Beans in liquidity pools on the Minting Whitelist per Bean, displayed as a percentage.',
        timeScaleKey: 'timestamp',
        priceScaleKey: 'supplyInPegLP',
        valueAxisType: 'L2SR',
        document: subgraphQueryConfigs.l2srBEAN.document,
        documentEntity: 'seasons',
        fetchType: 'both',
        queryConfig: subgraphQueryConfigs.l2srBEAN.queryOptions,
        valueFormatter: (v: string) => Number(v) * 100,
        tickFormatter: tickFormatPercentage,
        shortTickFormatter: tickFormatPercentage,
      },
    ];

    const siloCharts: ChartSetupBase[] = [
      ...depositCharts,
      {
        id: subgraphQueryConfigs.beanstalkTotalStalk.queryKey,
        name: `Stalk`,
        tooltipTitle: `Stalk`,
        tooltipHoverText: `The total number of Stalk at the beginning of every Season.`,
        shortDescription: 'The total number of Stalk.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'stalk',
        valueAxisType: 'stalk',
        document: subgraphQueryConfigs.beanstalkTotalStalk.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkTotalStalk.queryOptions,
        valueFormatter: 
          (value: any) => 
          (chain: "l1" | "l2") => Number(
            formatUnits(value, chain === "l1" ? 10 : stalk.decimals)
          ),
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatTruncated,
      },
      ...apyCharts,
    ];

    const fieldCharts: ChartSetupBase[] = [
      {
        id: subgraphQueryConfigs.beanstalkRRoR.queryKey,
        name: 'Real Rate of Return',
        tooltipTitle: 'Real Rate of Return',
        tooltipHoverText: 'The return for sowing Beans, accounting for Bean price. RRoR = (1 + Temperature) / TWAP.',
        shortDescription: 'The return for sowing Beans, accounting for Bean price. RRoR = (1 + Temperature) / TWAP.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'realRateOfReturn',
        valueAxisType: 'RRoR',
        document: subgraphQueryConfigs.beanstalkRRoR.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkRRoR.queryOptions,
        valueFormatter: (v: string) => Number(v) * 100,
        tickFormatter: tickFormatPercentage,
        shortTickFormatter: tickFormatPercentage,
      },
      {
        id: subgraphQueryConfigs.beanstalkMaxTemperature.queryKey,
        name: 'Max Temperature',
        tooltipTitle: 'Max Temperature',
        tooltipHoverText: 'The maximum interest rate for Sowing Beans every Season.',
        shortDescription: 'The maximum interest rate for Sowing Beans every Season.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'temperature',
        valueAxisType: 'maxTemp',
        document: subgraphQueryConfigs.beanstalkMaxTemperature.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkMaxTemperature.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: tickFormatPercentage,
        shortTickFormatter: tickFormatPercentage,
      },
      {
        id: subgraphQueryConfigs.beanstalkUnharvestablePods.queryKey,
        name: 'Pods',
        tooltipTitle: 'Pods',
        tooltipHoverText: 'The total number of Unharvestable Pods at the beginning of every Season.',
        shortDescription: 'The total number of Unharvestable Pods.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'unharvestablePods',
        valueAxisType: 'PODS_amount',
        document: subgraphQueryConfigs.beanstalkUnharvestablePods.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkUnharvestablePods.queryOptions,
        valueFormatter: valueFormatBeanAmount,
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatTruncated,
      },
      {
        id: subgraphQueryConfigs.beanstalkPodRate.queryKey,
        name: 'Pod Rate',
        tooltipTitle: 'Pod Rate',
        tooltipHoverText: 'The ratio of Unharvestable Pods per Bean, displayed as a percentage, at the beginning of every Season. The Pod Rate is used by Beanstalk as a proxy for its health.',
        shortDescription: 'The ratio of Unharvestable Pods per Bean, displayed as a percentage.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'podRate',
        valueAxisType: 'podRate',
        document: subgraphQueryConfigs.beanstalkPodRate.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkPodRate.queryOptions,
        valueFormatter: (v: string) => Number(v) * 100,
        tickFormatter: tickFormatPercentage,
        shortTickFormatter: tickFormatPercentage,
      },
      {
        id: subgraphQueryConfigs.beanstalkSownBeans.queryKey,
        name: 'Beans Sown',
        tooltipTitle: 'Beans Sown',
        tooltipHoverText: 'The total number of Beans Sown at the beginning of every Season.',
        shortDescription: 'The total number of Beans Sown.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'sownBeans',
        valueAxisType: 'BEAN_amount',
        document: subgraphQueryConfigs.beanstalkSownBeans.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkSownBeans.queryOptions,
        valueFormatter: valueFormatBeanAmount,
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatTruncated,
      },
      {
        id: subgraphQueryConfigs.beanstalkHarvestedPods.queryKey,
        name: 'Pods Harvested',
        tooltipTitle: 'Pods Harvested',
        tooltipHoverText: 'The total number of Pods Harvested at the beginning of every Season.',
        shortDescription: 'The total number of Pods Harvested.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'harvestedPods',
        valueAxisType: 'PODS_amount',
        document: subgraphQueryConfigs.beanstalkHarvestedPods.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkHarvestedPods.queryOptions,
        valueFormatter: valueFormatBeanAmount,
        tickFormatter: tickFormatBeanAmount,
        shortTickFormatter: tickFormatTruncated,
      },
      {
        id: subgraphQueryConfigs.beanstalkTotalSowers.queryKey,
        name: 'Total Sowers',
        tooltipTitle: 'Total Sowers',
        tooltipHoverText: 'The total number of unique Sowers at the beginning of every Season.',
        shortDescription: 'The total number of unique Sowers.',
        timeScaleKey: 'createdAt',
        priceScaleKey: 'numberOfSowers',
        valueAxisType: 'totalSowers',
        document: subgraphQueryConfigs.beanstalkTotalSowers.document,
        documentEntity: 'seasons',
        fetchType: "both",
        queryConfig: subgraphQueryConfigs.beanstalkTotalSowers.queryOptions,
        valueFormatter: (v: string) => Number(v),
        tickFormatter: (v: number) => v.toFixed(0).toString(),
        shortTickFormatter: (v: number) => v.toFixed(0).toString(),
      },
    ];

    beanCharts.forEach((chartData) => {
      const chartDataToAdd = {
        ...chartData,
        type: 'Bean',
        index: dataIndex,
      };
      output.push(chartDataToAdd);
      dataIndex += 1;
    });

    siloCharts.forEach((chartData) => {
      const chartDataToAdd = {
        ...chartData,
        type: 'Silo',
        index: dataIndex,
      };
      output.push(chartDataToAdd);
      dataIndex += 1;
    });

    fieldCharts.forEach((chartData) => {
      const chartDataToAdd = {
        ...chartData,
        type: 'Field',
        index: dataIndex,
      };
      output.push(chartDataToAdd);
      dataIndex += 1;
    });

    return output;
  }, [sdk]);
}
