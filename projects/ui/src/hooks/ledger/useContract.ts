import { Contract, ContractInterface, ethers } from 'ethers';
import { useCallback, useMemo } from 'react';
import { useContract as useWagmiContract } from '~/util/wagmi/useContract';

import BEANSTALK_FERTILIZER_ABI from '~/constants/abi/Beanstalk/BeanstalkFertilizer.json';
import ERC20_ABI from '~/constants/abi/ERC20.json';
import BEANFT_GENESIS_ABI from '~/constants/abi/BeaNFT/BeaNFTGenesis.json';
import BEANFT_WINTER_ABI from '~/constants/abi/BeaNFT/BeaNFTWinter.json';
import BEANFT_BARNRAISE_ABI from '~/constants/abi/BeaNFT/BeaNFTBarnRaise.json';
import AGGREGATOR_V3_ABI from '~/constants/abi/Chainlink/AggregatorV3.json';
import GNOSIS_DELEGATE_REGISTRY_ABI from '~/constants/abi/Gnosis/DelegateRegistry.json';
import ENS_REVERSE_RECORDS_ABI from '~/constants/abi/ENS/ENSReverseRecords.json';
import { SupportedChainId } from '~/constants/chains';
import useChainConstant from '~/hooks/chain/useChainConstant';
import {
  BEANFT_GENESIS_ADDRESSES,
  BEANFT_WINTER_ADDRESSES,
  BEANFT_BARNRAISE_ADDRESSES,
  BEANSTALK_FERTILIZER_ADDRESSES,
  DELEGATES_REGISTRY_ADDRESSES,
  ENS_REVERSE_RECORDS,
} from '~/constants/addresses';
import { ChainConstant } from '~/constants';
import { getChainConstant } from '~/util/Chain';
import { useSigner } from '~/hooks/ledger/useSigner';
import {
  BeaNFTGenesis,
  BeaNFTWinter,
  BeaNFTBarnRaise,
  BeanstalkFertilizer,
  ERC20,
  AggregatorV3,
  DelegateRegistry,
  ENSReverseRecords,
} from '~/generated/index';
import { useEthersProvider } from '~/util/wagmi/ethersAdapter';
import { Address } from '@beanstalk/sdk-core';
import useChainId from '~/hooks/chain/useChainId';
import useSdk from '../sdk';

export type AddressOrAddressMap = string | ChainConstant<string>;
export type AbiOrAbiMap = ContractInterface | ChainConstant<ContractInterface>;

// -------------------------------------------------

export function useContractReadOnly<T extends Contract = Contract>(
  addressOrAddressMap: AddressOrAddressMap,
  abiOrAbiMap: AbiOrAbiMap
): [T | null, SupportedChainId] {
  const provider = useEthersProvider();
  const address =
    typeof addressOrAddressMap === 'string'
      ? addressOrAddressMap
      : getChainConstant(addressOrAddressMap, provider.network.chainId);
  const abi = Array.isArray(abiOrAbiMap)
    ? abiOrAbiMap
    : getChainConstant(
        abiOrAbiMap as ChainConstant<ContractInterface>,
        provider.network.chainId
      );
  return useMemo(
    () =>
      // console.debug(`[useContractReadOnly] creating new instance of ${address}`);
      [
        address ? (new ethers.Contract(address, abi, provider) as T) : null,
        provider.network.chainId,
      ],
    [address, abi, provider]
  );
  // if (!address) throw new Error('Attempted to instantiate contract without address.')
  // if (!abi)     throw new Error('Attempted to instantiate contract without ABI.')
  // console.debug(`[useContractReadOnly] contract = ${address}, chainId = ${provider.network.chainId}`, {
  //   abi,
  //   abiLength: abi.length,
  //   lbn: provider._lastBlockNumber,
  //   chainId: provider.network.chainId,
  // })
  // return useWagmiContract<T>({
  //   addressOrName: address,
  //   contractInterface: abi,
  //   signerOrProvider: provider,
  // });
}

export function useGetContract<T extends Contract = Contract>(
  abiOrAbiMap: AbiOrAbiMap,
  useSignerIfPossible: boolean = true
): (addressOrAddressMap: AddressOrAddressMap) => [T | null, SupportedChainId] {
  const provider = useEthersProvider();
  const { data: signer } = useSigner();
  const chainId = provider.network.chainId;
  const abi = Array.isArray(abiOrAbiMap)
    ? abiOrAbiMap
    : getChainConstant(
        abiOrAbiMap as ChainConstant<ContractInterface>,
        chainId
      );
  const signerOrProvider = useSignerIfPossible && signer ? signer : provider;
  // useWhatChanged([abi,signerOrProvider,chainId], 'abi,signerOrProvider,chainId');

  //
  return useCallback(
    (addressOrAddressMap: AddressOrAddressMap) => {
      const address =
        typeof addressOrAddressMap === 'string'
          ? addressOrAddressMap
          : getChainConstant(addressOrAddressMap, chainId);
      // console.debug(`[useGetContract] creating new instance of ${address}, ${abi.length}, ${signerOrProvider}, ${chainId}`);
      return [
        address
          ? (new ethers.Contract(address, abi, signerOrProvider) as T)
          : null,
        chainId,
      ];
    },
    [abi, signerOrProvider, chainId]
  );
}

export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: AddressOrAddressMap,
  abiOrAbiMap: AbiOrAbiMap,
  useSignerIfPossible: boolean = true
): [T | null, SupportedChainId] {
  const getContract = useGetContract(abiOrAbiMap, useSignerIfPossible);
  return getContract(addressOrAddressMap) as [T | null, SupportedChainId]; // FIXME: hard casting
}

// --------------------------------------------------

export function useBeanstalkPriceContract() {
  const sdk = useSdk();
  return useMemo(
    () => sdk.contracts.beanstalkPrice,
    [sdk.contracts.beanstalkPrice]
  );
}

export function useBeanstalkFertilizerContract() {
  return useContract<BeanstalkFertilizer>(
    BEANSTALK_FERTILIZER_ADDRESSES,
    BEANSTALK_FERTILIZER_ABI,
    true
  );
}

export function useGetERC20Contract() {
  return useGetContract<ERC20>(ERC20_ABI, true);
}

export function useERC20Contract(addressOrAddressMap: AddressOrAddressMap) {
  const get = useGetERC20Contract();
  return get(addressOrAddressMap);
}

// --------------------------------------------------

export function useFertilizerContract(signer?: ethers.Signer | null) {
  const fertAddress = useChainConstant(BEANSTALK_FERTILIZER_ADDRESSES);
  const provider = useEthersProvider();
  return useWagmiContract({
    address: fertAddress,
    abi: BEANSTALK_FERTILIZER_ABI,
    signerOrProvider: signer || provider,
  }) as BeanstalkFertilizer;
}

export function useBeanstalkContract(_signer?: ethers.Signer | null) {
  const sdk = useSdk();
  return useMemo(() => sdk.contracts.beanstalk, [sdk.contracts.beanstalk]);
}

export function useGenesisNFTContract(signer?: ethers.Signer | null) {
  const address = useChainConstant(BEANFT_GENESIS_ADDRESSES);
  const provider = useEthersProvider();
  return useWagmiContract({
    address,
    abi: BEANFT_GENESIS_ABI,
    signerOrProvider: signer || provider,
  }) as BeaNFTGenesis;
}

export function useWinterNFTContract(signer?: ethers.Signer | null) {
  const address = useChainConstant(BEANFT_WINTER_ADDRESSES);
  const provider = useEthersProvider();
  return useWagmiContract({
    address,
    abi: BEANFT_WINTER_ABI,
    signerOrProvider: signer || provider,
  }) as BeaNFTWinter;
}

export function useBarnRaiseNFTContract(signer?: ethers.Signer | null) {
  const address = useChainConstant(BEANFT_BARNRAISE_ADDRESSES);
  const provider = useEthersProvider();
  return useWagmiContract({
    address,
    abi: BEANFT_BARNRAISE_ABI,
    signerOrProvider: signer || provider,
  }) as BeaNFTBarnRaise;
}

/** used to access chainlink price data feeds */
export function useAggregatorV3Contract(
  address: Address,
  signer?: ethers.Signer | null
) {
  const chainId = useChainId();
  const provider = useEthersProvider();
  return useWagmiContract({
    address: address.get(chainId),
    abi: AGGREGATOR_V3_ABI,
    signerOrProvider: signer || provider,
  }) as AggregatorV3;
}

export function useDelegatesRegistryContract(signer?: ethers.Signer | null) {
  const address = useChainConstant(DELEGATES_REGISTRY_ADDRESSES);
  const provider = useEthersProvider();
  return useWagmiContract({
    address,
    abi: GNOSIS_DELEGATE_REGISTRY_ABI,
    signerOrProvider: signer || provider,
  }) as DelegateRegistry;
}

export function useEnsReverseRecords(signer?: ethers.Signer | null) {
  const address = useChainConstant(ENS_REVERSE_RECORDS);
  const provider = useEthersProvider();
  return useWagmiContract({
    address,
    abi: ENS_REVERSE_RECORDS_ABI,
    signerOrProvider: signer || provider,
  }) as ENSReverseRecords;
}
