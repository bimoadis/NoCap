import { UAIMDocument, UAIMLiquidityVenue, UAIMTrading, UAIMOwnership, UAIMFundingGraph, UAIMWalletDNA, UAIMControlSurface, UAIMAsset, UAIMDeployment, UAIMCreator, UAIMMarket, UAIMNarrative } from '../../../../models/uaim/types.js';

export interface ChainClientAdapter {
  chainId: string;
  fetchTransaction(signature: string): Promise<any>;
  subscribeToLogs(callback: (log: any) => void): void;
  simulateCall?(target: string, data: string): Promise<any>;
}

export interface ExplorerAdapter {
  chainId: string;
  getTransactionHistory(address: string): Promise<any[]>;
  getTokenHolders(assetAddress: string): Promise<any[]>;
  isSourceVerified(address: string): Promise<boolean>;
}

export interface DexAdapter {
  chainId: string;
  getMarketState(assetAddress: string): Promise<{
    price: number;
    depth: number;
    venues: UAIMLiquidityVenue[];
  }>;
}

export interface LaunchSourceAdapter {
  chainId: string;
  getLaunchContext(assetAddress: string): Promise<{
    deployment: UAIMDeployment;
    creator: UAIMCreator;
    market: UAIMMarket;
    narrative: UAIMNarrative;
  }>;
}

export interface WalletAdapter {
  chainId: string;
  getWalletDNA(address: string): Promise<UAIMWalletDNA>;
}

export interface ControlSurfaceProbe {
  chainId: string;
  probeControlSurface(assetAddress: string): Promise<UAIMControlSurface>;
}
