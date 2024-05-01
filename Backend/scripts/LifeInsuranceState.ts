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
const acc5PrivateKey = process.env.PRIVATE_KEY5 || "";

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

  const account5 = privateKeyToAccount(`0x${acc5PrivateKey}`);
  const acc5 = createWalletClient({
    account: account5,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  // await initContracts();
  await checkState(publicClient);
  await getTokenHoldersInfo(publicClient, acc2, "Account 2");
  await getTokenHoldersInfo(publicClient, acc3, "Account 3");
  await getPolicyInfo(publicClient, acc4, "Account 4");
  await getPolicyInfo(publicClient, acc5, "Account 5");
}

async function checkState(publicClient: any) {
  const lifeContract = await viem.getContractAt(
    "LifeInsurance",
    LifeInsuranceContract
  );
  const paymentTokenAddress = await lifeContract.read.paymentToken();
  console.log("Life Insurance Token address = ", paymentTokenAddress);

  const threshold = await lifeContract.read.THRESHOLD();
  console.log("Life Insurance threshold = ", threshold);
  console.log("Life Insurance threshold in ETH= ", formatEther(threshold));

  const commisionRate = await lifeContract.read.COMMISSION_RATE();
  console.log("commisionRate % = ", commisionRate);

  const currentTestTime = await lifeContract.read.currentTestTime();
  console.log("currentTestTime = ", currentTestTime);

  const deathTestValue = await lifeContract.read.deathTestValue();
  console.log("deathTestValue = ", deathTestValue);

  const commissionCollectedTotal =
    await lifeContract.read.commissionCollectedTotal();
  console.log("commissionCollectedTotal = ", commissionCollectedTotal);
  console.log(
    "commissionCollectedTotal in ETH= ",
    formatEther(commissionCollectedTotal)
  );

  const totalTokens = await lifeContract.read.totalTokens();
  console.log("totalTokens = ", totalTokens);
  console.log(
    "commissionCollectedTotal in formatted ETH= ",
    formatEther(totalTokens)
  );

  // const balanceOfLifeInsurance = await LifeInsuranceContract.;
  const balance = await publicClient.getBalance({
    address: LifeInsuranceContract,
  });
  console.log("Balance of LifeInsurance address = ", balance);
  console.log(
    "Balance of LifeInsurance address in ETH = ",
    formatEther(balance)
  );
}

async function getTokenHoldersInfo(
  publicClient: any,
  acc: any,
  acctName: String
) {
  const tokensHolding = (await publicClient.readContract({
    address: LifeInsuranceContract,
    abi: abiLI,
    functionName: "investorTokenBalance",
    args: [acc.account.address],
  })) as any;

  console.log("Tokens for account ", acctName, " #Tokens - ", tokensHolding);
  console.log(
    "Tokens for account ",
    acctName,
    " #Tokens formatted - ",
    formatEther(tokensHolding)
  );
}

async function getPolicyInfo(publicClient: any, acc: any, acctName: String) {
  const policyRaw = (await publicClient.readContract({
    address: LifeInsuranceContract,
    abi: abiLI,
    functionName: "policies",
    args: [acc.account.address],
  })) as any;

  // const policy = await lifeContract.read.policies(acc.account.address);
  console.log(
    "policy info for account",
    acctName,
    " address - ",
    acc.account.address
  );
  console.log("policy object = ", policyRaw);
  // console.log("policy coverage = ", policy.coverageAmount);

  const policyHolderRaw = (await publicClient.readContract({
    address: LifeInsuranceContract,
    abi: abiLI,
    functionName: "policyholders",
    args: [acc.account.address],
  })) as any;
  console.log("policy holder info = ", policyHolderRaw);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
