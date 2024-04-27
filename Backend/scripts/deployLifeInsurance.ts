import { viem } from "hardhat";

import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

import {
  abi as abiT,
  bytecode as bytecodeT,
} from "../artifacts/contracts/LifeInsuranceToken.sol/LifeInsuranceToken.json";
import {
  abi as abiTB,
  bytecode as bytecodeTB,
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

const TOKEN_RATIO = 1000000000n;

async function initContracts() {
  const publicClient = await viem.getPublicClient();
  const [deployer, acc1, acc2] = await viem.getWalletClients();

  const contract = await viem.deployContract("LifeInsurance", [
    "LifeInsuranceToken",
    "LIFE",
    TOKEN_RATIO,
    "0x199839a4907ABeC8240D119B606C98c405Bb0B33", // Sepolia spotPrice Oracle address
  ]);
  contractAddress = contract.address;
  console.log("LifeInsurance address - ", contractAddress);
  tokenAddress = await contract.read.paymentToken();
  console.log("LifeInsuranceToken address - ", tokenAddress);
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
