import { useEffect, useState } from 'react';

type Well = {
  id: string;
  name: string;
  type: string; // wellFunctionType?
};

const EMPTY_WELL_STATE = {
  id: '',
  name: '',
  type: '',
};

type WellReserves = {
  token1: string;
  token1Amount: number;
  token1Percentage: number;
  token2: string;
  token2Amount: number;
  token2Percentage: number;
  usdTotal: number;
};

const EMPTY_WELL_RESERVES_STATE = {
  token1: '',
  token1Amount: 0,
  token1Percentage: 0,
  token2: '',
  token2Amount: 0,
  token2Percentage: 0,
  usdTotal: 0,
};

export const useWell = (wellId: string) => {
  // Possibly move this to app level state
  const [well, setWell] = useState<Well>(EMPTY_WELL_STATE);
  const [wellReserves, setWellReserves] = useState<WellReserves>(
    EMPTY_WELL_RESERVES_STATE
  );

  // Transient state
  const [loading, setLoading] = useState(true);

  // Use memo so we don't have to refetch
  const loadWell = async (wellId: string) => {
    // TODO: sdk.wells.getWell(wellId);
    setWell({
      id: wellId,
      name: 'BEAN/ETH',
      type: 'Constant Product',
    });
  };

  const getReserves = async (wellId: string) => {
    // TODO: sdk.wells.getReserves(wellId);
    setWellReserves({
      token1: 'BEAN',
      token1Amount: 750135,
      token1Percentage: 0.5005,
      token2: 'ETH',
      token2Amount: 35.15,
      token2Percentage: 0.4995,
      usdTotal: 10000,
    });
  };

  // load all well data on first access
  useEffect(() => {
    const loadAllWellData = async () => {
      await loadWell(wellId);
      await getReserves(wellId);
      setLoading(false);
    };
    setLoading(true);
    loadAllWellData();
  }, []);

  return {
    well,
    wellReserves,
    loading,
  };
};
