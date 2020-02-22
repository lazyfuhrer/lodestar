import {EventEmitter} from "events";

import {Root, Deposit, number64, Eth1Data, BeaconState} from "@chainsafe/eth2.0-types";

import {IEth1Notifier, IEthersEth1Options} from "../../../../src/eth1";
import {Block} from "ethers/providers";
import { IBeaconConfig } from "@chainsafe/eth2.0-config";

export class MockEth1Notifier extends EventEmitter implements IEth1Notifier {
  public constructor(opts: IEthersEth1Options) {
    super();
  }

  public async start(): Promise<void> {
  }

  public async stop(): Promise<void> {
  }

  public async isAfterEth2Genesis(): Promise<boolean> {
    return true;
  }

  public async processBlockHeadUpdate(blockNumber: string|number): Promise<void> {
  }

  public async processDepositLog(dataHex: string, indexHex: string): Promise<void> {
  }

  public async processEth2GenesisLog(
    depositRootHex: string,
    depositCountHex: string,
    timeHex: string, event: object
  ): Promise<void> {
  }

  public async genesisDeposits(): Promise<Deposit[]> {
    return [];
  }

  public async depositRoot(block?: string | number): Promise<Root> {
    return Buffer.alloc(32);
  }

  public async getContractDeposits(fromBlock: string | number, toBlock?: string | number): Promise<Deposit[]> {
    return [];
  }

  public async getBlock(blockHashOrBlockNumber: string | number): Promise<Block> {
    // @ts-ignore
    return undefined;
  }

  public async getHead(): Promise<Block> {
    // @ts-ignore
    return undefined;
  }

  public async depositCount(block?: string | number): Promise<number64> {
    // @ts-ignore
    return undefined;
  }

  public async processPastDeposits(fromBlock: string | number, toBlock?: string | number): Promise<void> {
    return undefined;
  }

  public async getEth1Vote(config: IBeaconConfig, state: BeaconState, previousEth1Distance: number64): Promise<Eth1Data> {
    return undefined;
  }

  public async getEth1Data(eth1Head: Block, distance: number64): Promise<Eth1Data> {
    return undefined;
  }

}
