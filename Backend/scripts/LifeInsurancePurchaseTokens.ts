import { viem } from "hardhat";

import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

// Import ethers from Hardhat package
const { ethers } = require("hardhat");

import {
  abi as abiT,
  bytecode as bytecodeT,
} from "../artifacts/contracts/LifeInsuranceToken.sol/LifeInsuranceToken.json";
import {
  abi as abiLI,
  bytecode as bytecodeLI,
} from "../artifacts/contracts/LifeInsurance.sol/LifeInsurance.json";

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
const acc4PrivateKey = process.env.PRIVATE_KEY4 || "";
const acc3PrivateKey = process.env.PRIVATE_KEY3 || "";

const providerApiKey = process.env.ALCHEMY_API_KEY || "";

const MAXUINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

let contractAddress: Address;
let tokenAddress: Address;

const LifeInsuranceContract = process.env.LifeInsuranceContract || "";
const LifeInsuranceTokenContract = process.env.LifeInsuranceTokenContract || "";

const BET_PRICE = "1";
const BET_FEE = "0.2";
const TOKEN_RATIO = 1n;

async function main() {
  // const publicClient = await viem.getPublicClient();
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  //   console.log("publicClient type = ", typeof publicClient);
  // const [deployer, acc1, acc2, acc3, acc4] = await viem.getWalletClients();

  const accountDeployer = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account: accountDeployer,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  // console.log("Deployer address:", deployer.account.address);
  // const balance = await publicClient.getBalance({
  //   address: deployer.account.address,
  // });
  // console.log(
  //   "Deployer balance:",
  //   formatEther(balance),
  //   deployer.chain.nativeCurrency.symbol
  // );

  const account2 = privateKeyToAccount(`0x${acc2PrivateKey}`);
  const acc2 = createWalletClient({
    account: account2,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account3 = privateKeyToAccount(`0x${acc3PrivateKey}`);
  const acc3 = createWalletClient({
    account: account3,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account4 = privateKeyToAccount(`0x${acc4PrivateKey}`);
  const acc4 = createWalletClient({
    account: account4,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  // open this to purchase tokens
  await purchaseTokens(acc2, account2, publicClient, 250000000000n); // ETH =  0.00000025
  await purchaseTokens(acc3, account3, publicClient, 10000000000000000n); // ETH = 0.1
  // await purchaseTokens(acc4, account4, publicClient, 250000000000n); // ETH = 0.1
}

async function purchaseTokens(
  acc: any,
  account: any,
  publicClient: any,
  amount: bigint
) {
  // Purchase Tokens
  const hash = await acc.writeContract({
    address: LifeInsuranceContract,
    abi: abiLI,
    functionName: "purchaseTokens",
    // args: [acc2.account.address],
    // account: voterAccount,
    account: account,
    value: amount,
  });
  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmations...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Transaction confirmed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
