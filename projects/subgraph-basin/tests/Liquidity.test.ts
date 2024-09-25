import { afterEach, assert, beforeEach, clearStore, describe, test } from "matchstick-as/assembly/index";
import { BI_10, toDecimal, ZERO_BI } from "../../subgraph-core/utils/Decimals";
import {
  BEAN_SWAP_AMOUNT,
  BEAN_USD_AMOUNT,
  WELL,
  WELL_ENTITY_TYPE,
  WELL_LP_AMOUNT,
  WETH_SWAP_AMOUNT,
  WETH_USD_AMOUNT
} from "./helpers/Constants";
import { boreDefaultWell } from "./helpers/Aquifer";
import {
  mockAddLiquidity,
  mockRemoveLiquidity,
  mockRemoveLiquidityOneBean,
  mockRemoveLiquidityOneWeth,
  mockSync
} from "./helpers/Liquidity";
import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { BigDecimal_max } from "../../subgraph-core/utils/ArrayMath";
import { calcLiquidityVolume } from "../src/utils/Volume";
import { BEAN_ERC20, WETH } from "../../subgraph-core/constants/raw/BeanstalkEthConstants";
import { initL1Version } from "./entity-mocking/MockVersion";
import { loadToken } from "../src/entities/Token";
import { loadWell } from "../src/entities/Well";

const BI_2 = BigInt.fromU32(2);
const BI_3 = BigInt.fromU32(3);
const BI_4 = BigInt.fromU32(4);
const BD_2 = BigDecimal.fromString("2");
const BD_3 = BigDecimal.fromString("3");
const BD_4 = BigDecimal.fromString("4");

function zeroNegative(tokenAmounts: BigInt[]): BigInt[] {
  return [tokenAmounts[0] < ZERO_BI ? ZERO_BI : tokenAmounts[0], tokenAmounts[1] < ZERO_BI ? ZERO_BI : tokenAmounts[1]];
}

function assignUSD(tokenAmounts: BigInt[]): BigDecimal[] {
  const bean = loadToken(BEAN_ERC20);
  const weth = loadToken(WETH);
  return [
    toDecimal(tokenAmounts[0], bean.decimals).times(bean.lastPriceUSD),
    toDecimal(tokenAmounts[1], weth.decimals).times(weth.lastPriceUSD)
  ];
}

describe("Well Entity: Liquidity Event Tests", () => {
  beforeEach(() => {
    initL1Version();
    boreDefaultWell();
  });

  afterEach(() => {
    clearStore();
  });

  describe("Add Liquidity - Multiple", () => {
    beforeEach(() => {
      mockAddLiquidity();
    });
    test("Deposit counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeDepositCount", "1");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT, endingBalances[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, endingBalances[1]);
    });
    test("Token Balances USD updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reservesUSD;

      assert.stringEquals(BEAN_USD_AMOUNT.toString(), endingBalances[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), endingBalances[1].toString());
      assert.stringEquals(WETH_USD_AMOUNT.times(BigDecimal.fromString("2")).toString(), updatedStore.totalLiquidityUSD.toString());
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", WELL_LP_AMOUNT.toString());
    });
    test("Zero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() == "0");
    });
    test("Token volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT, transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), transferReservesUSD[1].toString());
    });
  });

  describe("Add Liquidity - One", () => {
    beforeEach(() => {
      mockAddLiquidity();
      mockAddLiquidity([BEAN_SWAP_AMOUNT, ZERO_BI], WELL_LP_AMOUNT, BigDecimal.fromString("0.5"));
    });
    test("Deposit counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeDepositCount", "2");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.times(BI_2), endingBalances[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, endingBalances[1]);
    });
    test("Token Balances USD updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reservesUSD;

      // Bean balance is still only one unit of BEAN_USD_AMOUNT because the price was cut in half on the second deposit
      assert.stringEquals(BEAN_USD_AMOUNT.toString(), endingBalances[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), endingBalances[1].toString());
      assert.stringEquals(BEAN_USD_AMOUNT.plus(WETH_USD_AMOUNT).toString(), updatedStore.totalLiquidityUSD.toString());
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", WELL_LP_AMOUNT.times(BI_2).toString());
    });
    test("Nonzero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() != "0");
    });
    test("Token volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.times(BI_2), transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.times(BigDecimal.fromString("1.5")).toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), transferReservesUSD[1].toString());
    });
  });

  describe("Sync (Add Liquidity) - Multiple", () => {
    beforeEach(() => {
      mockAddLiquidity([BEAN_SWAP_AMOUNT.div(BI_2), WETH_SWAP_AMOUNT.div(BI_2)]);
      mockSync([BEAN_SWAP_AMOUNT, WETH_SWAP_AMOUNT], BI_10);
    });
    test("Deposit counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeDepositCount", "2");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT, endingBalances[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, endingBalances[1]);
    });
    test("Token Balances USD updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reservesUSD;

      assert.stringEquals(BEAN_USD_AMOUNT.toString(), endingBalances[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), endingBalances[1].toString());
      assert.stringEquals(WETH_USD_AMOUNT.times(BigDecimal.fromString("2")).toString(), updatedStore.totalLiquidityUSD.toString());
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", WELL_LP_AMOUNT.plus(BI_10).toString());
    });
    test("Zero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() == "0");
    });
    test("Token volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT, transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), transferReservesUSD[1].toString());
    });
  });

  describe("Sync (Add Liquidity) - One", () => {
    beforeEach(() => {
      mockAddLiquidity([BEAN_SWAP_AMOUNT.div(BI_2), WETH_SWAP_AMOUNT.div(BI_2)]);
      // WETH is doubled so the bean price is also doubled
      mockSync([BEAN_SWAP_AMOUNT.div(BI_2), WETH_SWAP_AMOUNT], BI_10, BigDecimal.fromString("2"));
    });
    test("Deposit counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeDepositCount", "2");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.div(BI_2), endingBalances[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, endingBalances[1]);
    });
    test("Token Balances USD updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reservesUSD;

      // WETH was doubled from the initial, so the bean price has also doubled
      assert.stringEquals(BEAN_USD_AMOUNT.toString(), endingBalances[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), endingBalances[1].toString());
      assert.stringEquals(BEAN_USD_AMOUNT.plus(WETH_USD_AMOUNT).toString(), updatedStore.totalLiquidityUSD.toString());
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", WELL_LP_AMOUNT.plus(BI_10).toString());
    });
    test("Nonzero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() != "0");
    });
    test("Token volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.div(BI_2), transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.div(BD_2).toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.toString(), transferReservesUSD[1].toString());
    });
  });

  describe("Remove Liquidity - Multiple", () => {
    beforeEach(() => {
      mockAddLiquidity();
      mockRemoveLiquidity();
    });
    test("Withdraw counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeWithdrawCount", "1");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(ZERO_BI, endingBalances[0]);
      assert.bigIntEquals(ZERO_BI, endingBalances[1]);
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", "0");
    });
    test("Zero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() == "0");
    });
    test("Token volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.times(BI_2), transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT.times(BI_2), transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.times(BD_2).toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.times(BD_2).toString(), transferReservesUSD[1].toString());
    });
  });

  describe("Remove Liquidity One - Bean", () => {
    beforeEach(() => {
      mockAddLiquidity();
      mockAddLiquidity();
      mockRemoveLiquidityOneBean();
    });
    test("Withdraw counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeWithdrawCount", "1");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT, endingBalances[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT.times(BI_2), endingBalances[1]);
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", WELL_LP_AMOUNT.toString());
    });
    test("Nonzero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() != "0");
    });
    test("Token volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.times(BI_3), transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT.times(BI_2), transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.times(BD_3).toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.times(BD_2).toString(), transferReservesUSD[1].toString());
    });
  });

  describe("Remove Liquidity One - WETH", () => {
    beforeEach(() => {
      mockAddLiquidity();
      mockAddLiquidity();
      mockRemoveLiquidityOneWeth(WELL_LP_AMOUNT, BigDecimal.fromString("0.5"));
    });
    test("Withdraw counter incremented", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "cumulativeWithdrawCount", "1");
    });
    test("Token Balances updated", () => {
      let updatedStore = loadWell(WELL);
      let endingBalances = updatedStore.reserves;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.times(BI_2), endingBalances[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT, endingBalances[1]);
    });
    test("Liquidity Token balance", () => {
      assert.fieldEquals(WELL_ENTITY_TYPE, WELL.toHexString(), "lpTokenSupply", WELL_LP_AMOUNT.toString());
    });
    test("Nonzero trading volume", () => {
      let updatedStore = loadWell(WELL);
      assert.assertTrue(updatedStore.cumulativeTradeVolumeUSD.toString() != "0");
    });
    test("Transfer volumes updated", () => {
      let updatedStore = loadWell(WELL);
      const transferReserves = updatedStore.cumulativeTransferVolumeReserves;
      const transferReservesUSD = updatedStore.cumulativeTransferVolumeReservesUSD;

      assert.bigIntEquals(BEAN_SWAP_AMOUNT.times(BI_2), transferReserves[0]);
      assert.bigIntEquals(WETH_SWAP_AMOUNT.times(BI_3), transferReserves[1]);
      assert.stringEquals(BEAN_USD_AMOUNT.times(BD_2).toString(), transferReservesUSD[0].toString());
      assert.stringEquals(WETH_USD_AMOUNT.times(BD_3).toString(), transferReservesUSD[1].toString());
    });
  });
});
