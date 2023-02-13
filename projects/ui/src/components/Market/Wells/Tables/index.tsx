import React, { useEffect, useState } from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';
import { DataGridProps } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import BigNumber from 'bignumber.js';
import useTabs from '~/hooks/display/useTabs';
import COLUMNS from '~/components/Common/Table/cells';
import useMarketData from '~/hooks/beanstalk/useMarketData';
import TabTable from '~/components/Common/Table/TabTable';
import { Module, ModuleContent } from '~/components/Common/Module';
import { BEAN, PODS } from '~/constants/tokens';
import { FC } from '~/types';

// TODO: dummy type
export type WellActivityData = {
  hash: string;
  label: string;
  totalValue: BigNumber;
  tokenAmount0: BigNumber;
  tokenAmount1: BigNumber;
  account: string;
  time: string;
};

const EMPTY_ACTIVITY_DATA: WellActivityData[] = [];

const SLUGS = ['all', 'swaps', 'adds', 'removes'];

// Activity that appears on the bottom of the Well detail page
// I.e. swaps/ adds/ removes
const WellActivity: FC<{}> = () => {
  const theme = useTheme();
  const [tab, handleChangeTab] = useTabs(SLUGS, 'bean');
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const data = useMarketData();

  /// Data Grid setup
  const columns: DataGridProps['columns'] = !isMobile
    ? [
        // COLUMNS.listingId(1.3),
        // // index
        // COLUMNS.plotIndex(data.harvestableIndex, 1),
        // // pricePerPod
        // COLUMNS.pricePerPod(1),
        // // amount
        // maxHarvestableIndex
        COLUMNS.label(
          2.5,
          <Tabs value={tab} onChange={handleChangeTab}>
            <Tab label="All" />
            <Tab label="Swaps" />
            <Tab label="Adds" />
            <Tab label="Removes" />
          </Tabs>
        ),
        COLUMNS.totalValue(1),
        COLUMNS.tokenAmount('tokenAmount0', BEAN[1], 1),
        COLUMNS.tokenAmount('tokenAmount1', PODS, 1),
        COLUMNS.account(1),
        COLUMNS.time(1),
      ]
    : [];

  const [wellActivityData, setWellActivityData] = useState(EMPTY_ACTIVITY_DATA);

  useEffect(() => {
    // TODO: Replace sample data with SDK call
    setWellActivityData(
      new Array(30).fill(null).map((_, _i) => ({
        hash: '0x41cce5bd2aad02e63f7f5eb4d88f36a3f756fa73708119b487006f4281eb5ba0',
        label: 'Swap ETH for BEAN',
        totalValue: new BigNumber(3000 * Math.random()),
        tokenAmount0: new BigNumber(Math.random()),
        tokenAmount1: new BigNumber(3000 * Math.random()),
        account: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
        time: `${Math.round(Math.random() * 100)} minutes ago`,
      }))
    );
  }, []);

  return (
    <Module sx={{ py: 2, px: 1 }}>
      <ModuleContent>
        <TabTable
          columns={columns}
          rows={wellActivityData}
          loading={data.loading}
          maxRows={8}
          getRowId={(row: WellActivityData) => row.hash}
        />
      </ModuleContent>
    </Module>
  );
};

export default WellActivity;
