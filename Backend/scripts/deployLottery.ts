import { viem } from "hardhat";

import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

import {
  abi as abiT,
  bytecode as bytecodeT,
} from "../artifacts/contracts/LotteryToken.sol/LotteryToken.json";
import {
  abi as abiTB,
  bytecode as bytecodeTB,
} from "../artifacts/contracts/Lottery.sol/Lottery.json";

import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  toHex,
  hexToString,
  parseEther,
  Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const acc2PrivateKey = process.env.PRIVATE_KEY2 || "";

const providerApiKey = process.env.ALCHEMY_API_KEY || "";

const MAXUINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

let contractAddress: Address;
let tokenAddress: Address;

const BET_PRICE = "1";
const BET_FEE = "0.2";
const TOKEN_RATIO = 1000000000n;

async function initContracts() {
  const publicClient = await viem.getPublicClient();
  const [deployer, acc1, acc2] = await viem.getWalletClients();

  const contract = await viem.deployContract("Lottery", [
    "LotteryToken1",
    "LOTTO1",
    TOKEN_RATIO,
    parseEther(BET_PRICE),
    parseEther(BET_FEE),
  ]);
  contractAddress = contract.address;
  console.log("Lottery address - ", contractAddress);
  tokenAddress = await contract.read.paymentToken();
  console.log("Token address - ", tokenAddress);
}

async function main() {
  // const publicClient = await viem.getPublicClient();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const accountDeployer = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account: accountDeployer,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  await initContracts();

  // console.log("\nDeploying Lottery contract");
  // const hashDeployLottery = await deployer.deployContract({
  //   abi: abiTB,
  //   bytecode: bytecodeTB as `0x${string}`,
  //   args: [
  //     "LotteryToken",
  //     "LOTTO",
  //     TOKEN_RATIO,
  //     parseEther(BET_PRICE),
  //     parseEther(BET_FEE),
  //   ],
  // });
  // console.log("Transaction hash:", hashDeployLottery);
  // console.log("Waiting for confirmations...");
  // const receiptDeployToken = await publicClient.waitForTransactionReceipt({
  //   hash: hashDeployLottery,
  // });
  // console.log(
  //   "Lottery contract deployed to :",
  //   receiptDeployToken.contractAddress
  // );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
