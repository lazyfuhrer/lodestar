import {CliCommand} from "./interface";
import {CommanderStatic} from "commander";
import defaults from "../../eth1/defaults";
import * as ethers from "ethers/ethers";
import {Wallet} from "ethers/ethers";
import logger from "../../logger";
import {Eth1Wallet} from "../../eth1";
import {CliError} from "../error";

interface IDepositCommandOptions {
  privateKey: string;
  mnemonic: string;
  node: string;
  value: string;
  contract: string;
}

export class DepositCommand implements CliCommand {

  public register(commander: CommanderStatic): void {
    commander
      .command('deposit')
      .description('Start private network with deposit contract and 10 accounts with balance')
      .option("-k, --privateKey [privateKey]", 'Private key of account that will make deposit')
      .option("-m, --mnemonic [mnemonic]", 'If mnemonic is submitted, first 10 accounts will make deposit')
      .option("-n, --node [node]", 'Url of eth1 node', 'http://127.0.0.1:8545')
      .option("-v, --value [value]", 'Amount of ether to deposit', "32")
      .option("-c, --contract [contract]", 'Address of deposit contract', defaults.depositContract.address)
      .action( async (options) => {
        //library is not awaiting this method so don't allow error propagation 
        // (unhandled promise rejections)
        try {
          await this.action(options);
        } catch (e) {
          logger.error(e.message);
        }

      });
  }

  public async action(options: IDepositCommandOptions): Promise<void> {
    const provider = new ethers.providers.JsonRpcProvider(options.node);
    try {
      //check if we can connect to node
      await provider.getBlockNumber();
    } catch (e) {
      throw new CliError(`JSON RPC node (${options.node}) not available. Reason: ${e.message}`);
    }

    const wallets = [];
    if(options.mnemonic) {
      wallets.push(...this.fromMnemonic(options.mnemonic, provider, 10));
    } else if (options.privateKey) {
      wallets.push(new Wallet(options.privateKey, provider));
    } else {
      throw new CliError('You have to submit either privateKey or mnemonic. Check --help');
    }

    await Promise.all(
      wallets.map(async wallet => {
        try {
          const hash = await (new Eth1Wallet(wallet.privateKey, provider))
            .createValidatorDeposit(options.contract, ethers.utils.parseEther(options.value));
          logger.info(`Successfully deposited ${options.value} ETH from ${wallet.address} to deposit contract. Tx hash: ${hash}`);
        } catch (e) {
          throw new CliError(`Failed to make deposit for account ${wallet.address}. Reason: ${e.message}`);
        }
      })
    );

  }

  /**
   *
   * @param mnemonic
   * @param provider
   * @param n number of wallets to retrieve
   */
  private fromMnemonic(mnemonic: string, provider, n: number): Wallet[] {
    const wallets = [];
    for (let i = 0; i < n; i++) {
      let wallet = Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
      wallet = wallet.connect(provider);
      wallets.push(wallet);
    }
    return wallets;
  }
}
