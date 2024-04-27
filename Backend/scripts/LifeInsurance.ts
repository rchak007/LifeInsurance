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

const providerApiKey = process.env.ALCHEMY_API_KEY || "";

const MAXUINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

let contractAddress: Address;
let tokenAddress: Address;

const LifeInsuranceContract = "0xe4c90d037a74b29e0b9d8162ae0bebf045970460";
const LifeInsuranceTokenContract = "0x3F7822Ce3e9040f552e4Aec2730A46C5182c4AAb";

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

  console.log("Deployer address:", deployer.account.address);
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log(
    "Deployer balance:",
    formatEther(balance),
    deployer.chain.nativeCurrency.symbol,
  );

  const account2 = privateKeyToAccount(`0x${acc2PrivateKey}`);
  const acc2 = createWalletClient({
    account: account2,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  // await purchaseTokens(acc2, account2, publicClient, 2500000000n);

  // await initContracts();
  await checkState(publicClient);
}

async function getAccounts() {
  return await viem.getWalletClients();
}

async function getClient() {
  return await viem.getPublicClient();
}

async function purchaseTokens(
  acc2: any,
  account2: any,
  publicClient: any,
  amount: bigint,
) {
  // Purchase Tokens
  const hash = await acc2.writeContract({
    address: LifeInsuranceContract,
    abi: abiLI,
    functionName: "purchaseTokens",
    // args: [acc2.account.address],
    // account: voterAccount,
    account: account2,
    value: amount,
  });
  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmations...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Transaction confirmed");
}

async function checkState(publicClient: any) {
  const tokenContract = await viem.getContractAt(
    "LifeInsurance",
    LifeInsuranceContract,
  );
  const paymentTokenAddress = await tokenContract.read.paymentToken();
  console.log("Token address = ", paymentTokenAddress);

  // Get the balance of the contract
  // const balance = await ethers.provider.getBalance(LifeInsuranceContract);

  // const balanceOfLifeInsurance = await LifeInsuranceContract.;
  const balance = await publicClient.getBalance({
    address: LifeInsuranceContract,
  });
  console.log("Balance of LifeInsurance address = ", balance);

  // const publicClient = await getClient();
  // const currentBlock = await publicClient.getBlock();
  // const timestamp = Number(currentBlock?.timestamp) ?? 0;
  // const currentBlockDate = new Date(timestamp * 1000);
  // const closingTime = await contract.read.betsClosingTime();
  // const closingTimeDate = new Date(Number(closingTime) * 1000);
  // console.log(
  //   `The last block was mined at ${currentBlockDate.toLocaleDateString()} : ${currentBlockDate.toLocaleTimeString()}\n`,
  // );
  // console.log(
  //   `lottery should close at ${closingTimeDate.toLocaleDateString()} : ${closingTimeDate.toLocaleTimeString()}\n`,
  // );
}

// async function openBets(duration: string) {
//   const contract = await viem.getContractAt("Lottery", contractAddress);
//   const publicClient = await getClient();
//   const currentBlock = await publicClient.getBlock();
//   const timestamp = currentBlock?.timestamp ?? 0;
//   const tx = await contract.write.openBets([timestamp + BigInt(duration)]);
//   const receipt = await publicClient.getTransactionReceipt({ hash: tx });
//   console.log(`Bets opened (${receipt?.transactionHash})`);
// }

async function displayBalance(index: string) {
  const publicClient = await getClient();
  const accounts = await getAccounts();
  const balanceBN = await publicClient.getBalance({
    address: accounts[Number(index)].account.address,
  });
  const balance = formatEther(balanceBN);
  console.log(
    `The account of address ${
      accounts[Number(index)].account.address
    } has ${balance} ETH\n`,
  );
}

async function buyTokens(index: string, amount: string) {
  const accounts = await getAccounts();
  const publicClient = await getClient();
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const tx = await contract.write.purchaseTokens({
    value: parseEther(amount) / TOKEN_RATIO,
    account: accounts[Number(index)].account,
  });
  const receipt = await publicClient.getTransactionReceipt({ hash: tx });
  console.log(`Tokens bought (${receipt?.transactionHash})\n`);
}

async function displayTokenBalance(index: string) {
  const accounts = await getAccounts();
  const token = await viem.getContractAt("LotteryToken", tokenAddress);
  const balanceBN = await token.read.balanceOf([
    accounts[Number(index)].account.address,
  ]);
  const balance = formatEther(balanceBN);
  console.log(
    `The account of address ${
      accounts[Number(index)].account.address
    } has ${balance} LT0\n`,
  );
}

async function bet(index: string, amount: string) {
  const accounts = await getAccounts();
  const publicClient = await getClient();
  const token = await viem.getContractAt("LotteryToken", tokenAddress);
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const allowTx = await token.write.approve([contractAddress, MAXUINT256], {
    account: accounts[Number(index)].account,
  });
  await publicClient.getTransactionReceipt({ hash: allowTx });
  const tx = await contract.write.betMany([BigInt(amount)], {
    account: accounts[Number(index)].account,
  });
  const receipt = await publicClient.getTransactionReceipt({ hash: tx });
  console.log(`Bets placed (${receipt?.transactionHash})\n`);
}

async function closeLottery() {
  const publicClient = await getClient();
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const tx = await contract.write.closeLottery();
  const receipt = await publicClient.getTransactionReceipt({ hash: tx });
  console.log(`Bets closed (${receipt?.transactionHash})\n`);
}

async function displayPrize(index: string): Promise<string> {
  const accounts = await getAccounts();
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const prizeBN = await contract.read.prize([
    accounts[Number(index)].account.address,
  ]);
  const prize = formatEther(prizeBN);
  console.log(
    `The account of address ${
      accounts[Number(index)].account.address
    } has earned a prize of ${prize} Tokens\n`,
  );
  return prize;
}

async function claimPrize(index: string, amount: string) {
  const accounts = await getAccounts();
  const publicClient = await getClient();
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const tx = await contract.write.prizeWithdraw([parseEther(amount)], {
    account: accounts[Number(index)].account,
  });
  const receipt = await publicClient.getTransactionReceipt({ hash: tx });
  console.log(`Prize claimed (${receipt?.transactionHash})\n`);
}

async function displayOwnerPool() {
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const balanceBN = await contract.read.ownerPool();
  const balance = formatEther(balanceBN);
  console.log(`The owner pool has (${balance}) Tokens \n`);
}

async function withdrawTokens(amount: string) {
  const publicClient = await getClient();
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const tx = await contract.write.ownerWithdraw([parseEther(amount)]);
  const receipt = await publicClient.getTransactionReceipt({ hash: tx });
  console.log(`Withdraw confirmed (${receipt?.transactionHash})\n`);
}

async function burnTokens(index: string, amount: string) {
  const accounts = await getAccounts();
  const publicClient = await getClient();
  const token = await viem.getContractAt("LotteryToken", tokenAddress);
  const contract = await viem.getContractAt("Lottery", contractAddress);
  const allowTx = await token.write.approve([contractAddress, MAXUINT256], {
    account: accounts[Number(index)].account,
  });
  const receiptAllow = await publicClient.getTransactionReceipt({
    hash: allowTx,
  });
  console.log(`Allowance confirmed (${receiptAllow?.transactionHash})\n`);
  const tx = await contract.write.returnTokens([parseEther(amount)], {
    account: accounts[Number(index)].account,
  });
  const receipt = await publicClient.getTransactionReceipt({ hash: tx });
  console.log(`Burn confirmed (${receipt?.transactionHash})\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
