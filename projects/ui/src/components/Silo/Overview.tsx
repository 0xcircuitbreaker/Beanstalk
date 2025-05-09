import React, { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import useFarmerBalancesBreakdown from '~/hooks/farmer/useFarmerBalancesBreakdown';
import { AppState } from '~/state';
import useTabs from '~/hooks/display/useTabs';
import TokenIcon from '~/components/Common/TokenIcon';
import { SEEDS, STALK } from '~/constants/tokens';
import { displayPercentage, displayStalk, displayUSD } from '~/util';
import { ChipLabel, StyledTab } from '~/components/Common/Tabs';
import { ZERO_BN } from '~/constants';
import Row from '~/components/Common/Row';
import useAccount from '~/hooks/ledger/useAccount';
import { Module, ModuleTabs } from '~/components/Common/Module';
import OverviewPlot from '~/components/Silo/OverviewPlot';
import Stat from '~/components/Common/Stat';
import useFarmerSiloHistory from '~/hooks/farmer/useFarmerSiloHistory';
import { FC } from '~/types';
import { BaseDataPoint } from '~/components/Common/Charts/ChartPropProvider';
import stalkIconWinter from '~/img/beanstalk/stalk-icon-green.svg';
import seedIconWinter from '~/img/beanstalk/seed-icon-green.svg';

const SLUGS = ['deposits', 'stalk', 'seeds'];

const Overview: FC<{
  farmerSilo: AppState['_farmer']['silo'];
  beanstalkSilo: AppState['_beanstalk']['silo'];
  breakdown: ReturnType<typeof useFarmerBalancesBreakdown>;
  season: BigNumber;
}> = ({ farmerSilo, beanstalkSilo, breakdown, season }) => {
  //
  const account = useAccount();
  const { data, loading } = useFarmerSiloHistory(account, false, true);
  //
  const [tab, handleChange] = useTabs(SLUGS, 'view');
  //
  const ownership =
    farmerSilo.stalk.active?.gt(0) && beanstalkSilo.stalk.total?.gt(0)
      ? farmerSilo.stalk.active.div(beanstalkSilo.stalk.total)
      : ZERO_BN;

  const stackedChartData: any[] = useMemo(() => {
    const chartData: any[] = [];
    if (data.stalk.length > 0) {
      chartData.length = 0;
      data.stalk.forEach((_, index) => {
        const newData = {
          season: data.stalk[index].season,
          date: data.stalk[index].date,
          stalk: data.stalk[index].value,
          grownStalk: data.grownStalk[index].value,
          value: data.stalk[index].value + data.grownStalk[index].value,
        };
        chartData.push(newData);
      });
    }
    return chartData;
  }, [data]);

  const keysAndTooltips = {
    stalk: 'Stalk',
    grownStalk: 'Grown Stalk',
  };

  const depositStats = useCallback(
    (dataPoint: BaseDataPoint | undefined) => {
      const latestData = data.deposits[data.deposits.length - 1];

      const _season = dataPoint ? dataPoint.season : season;
      const _date = dataPoint
        ? dataPoint.date
        : latestData
          ? latestData.date
          : '';
      const _value = BigNumber(dataPoint?.value ?? latestData?.value ?? 0);

      return (
        <Stat
          title="Value Deposited"
          titleTooltip={
            <>
              The historical USD value of your Silo Deposits. <br />
              <Typography variant="bodySmall">
                Note: Unripe assets are valued based on the current Chop Rate.
                Earned Beans are shown upon Plant.
              </Typography>
            </>
          }
          color="primary"
          subtitle={`Season ${_season.toString()}`}
          secondSubtitle={
            _date
              ? _date.toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : '-'
          }
          amount={displayUSD(_value)}
          amountIcon={undefined}
          gap={0.25}
          sx={{ ml: 0 }}
        />
      );
    },
    [data.deposits, season]
  );

  const stalkStats = useCallback(
    (dataPoint: BaseDataPoint | undefined) => {
      const latestData = stackedChartData[stackedChartData.length - 1];

      const _season = dataPoint ? dataPoint.season : season;
      const _date = dataPoint
        ? dataPoint.date
        : latestData
          ? latestData.date
          : '';
      const _stalkValue = dataPoint
        ? dataPoint.stalk
        : account
          ? farmerSilo.stalk.active
          : '';
      const _grownStalkValue = dataPoint
        ? dataPoint.grownStalk
        : latestData && account
          ? latestData.grownStalk
          : '';
      return (
        <>
          <Stat
            title="Stalk Balance"
            titleTooltip="Stalk is the governance token of the Beanstalk DAO. Stalk entitles holders to passive interest in the form of a share of future Bean mints, and the right to propose and vote on BIPs. Your Stalk is forfeited when you Withdraw your Deposited assets from the Silo."
            subtitle={`Season ${_season.toString()}`}
            secondSubtitle={
              _date
                ? _date.toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : '-'
            }
            amount={
              _stalkValue ? displayStalk(BigNumber(_stalkValue, 10)) : '0'
            }
            color="text.primary"
            sx={{ minWidth: 220, ml: 0 }}
            gap={0.25}
          />
          <Stat
            title="Stalk Ownership"
            titleTooltip="Your current ownership of Beanstalk is displayed as a percentage. Ownership is determined by your proportional ownership of the total Stalk supply."
            amount={
              account ? displayPercentage(ownership.multipliedBy(100)) : '0'
            }
            color="text.primary"
            gap={0.25}
            sx={{ minWidth: 200, ml: 0 }}
          />
          <Stat
            title="Grown Stalk"
            titleTooltip="The total number of Mowable Grown Stalk your Deposits have accrued."
            amount={
              account && _grownStalkValue
                ? displayStalk(BigNumber(_grownStalkValue, 10))
                : '0'
            }
            color="text.primary"
            gap={0.25}
            sx={{ minWidth: 120, ml: 0 }}
          />
        </>
      );
    },
    [farmerSilo.stalk.active, season, stackedChartData, ownership, account]
  );

  const seedsStats = useCallback(
    (dataPoint: BaseDataPoint | undefined) => {
      const latestData = data.deposits[data.deposits.length - 1];

      const _season = dataPoint ? dataPoint.season : season;
      const _date = dataPoint
        ? dataPoint.date
        : latestData
          ? latestData.date
          : '';
      const _value = dataPoint
        ? BigNumber(dataPoint.value, 10)
        : farmerSilo.seeds.active;

      return (
        <Stat
          title="Seed Balance"
          titleTooltip="Seeds are illiquid tokens that yield 1/10,000 Stalk each Season."
          subtitle={`Season ${_season.toString()}`}
          secondSubtitle={
            _date
              ? _date.toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : '-'
          }
          amount={displayStalk(_value)}
          sx={{ minWidth: 180, ml: 0 }}
          amountIcon={undefined}
          gap={0.25}
        />
      );
    },
    [data.deposits, farmerSilo.seeds.active, season]
  );

  return (
    <Module>
      <ModuleTabs value={tab} onChange={handleChange} sx={{ minHeight: 0 }}>
        <StyledTab
          label={
            <ChipLabel name="Deposits">
              {breakdown.states.deposited.value.gt(0)
                ? displayUSD(breakdown.states.deposited.value)
                : '?'}
            </ChipLabel>
          }
        />
        <StyledTab
          label={
            <ChipLabel name="Stalk">
              <Row alignItems="center">
                <TokenIcon token={STALK} logoOverride={stalkIconWinter} />{' '}
                {displayStalk(farmerSilo.stalk.active, 0)}
              </Row>
            </ChipLabel>
          }
        />
        <StyledTab
          label={
            <ChipLabel name="Seeds">
              <Row alignItems="center">
                <TokenIcon token={SEEDS} logoOverride={seedIconWinter} />{' '}
                {displayStalk(farmerSilo.seeds.active, 0)}
              </Row>
            </ChipLabel>
          }
        />
      </ModuleTabs>
      <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Silo Deposits"
          account={account}
          series={
            useMemo(() => [data.deposits], [data.deposits]) as BaseDataPoint[][]
          }
          stats={depositStats}
          loading={loading}
          empty={breakdown.states.deposited.value.eq(0)}
        />
      </Box>
      <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Stalk Ownership"
          account={account}
          series={[stackedChartData]}
          useStackedChart
          keysAndTooltips={keysAndTooltips}
          stats={stalkStats}
          loading={loading}
          empty={farmerSilo.stalk.total.lte(0)}
        />
      </Box>
      <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
        <OverviewPlot
          label="Seeds Ownership"
          account={account}
          series={useMemo(() => [data.seeds], [data.seeds])}
          stats={seedsStats}
          loading={loading}
          empty={farmerSilo.seeds.total.lte(0)}
        />
      </Box>
    </Module>
  );
};

export default Overview;
