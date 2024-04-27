import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  abi,
  bytecode,
} from "../artifacts/contracts/CallOracle.sol/CallOracle.json";
import * as dotenv from "dotenv";
dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const CALL_ORACLE_CONTRACT_ADDRESS =
  "0xF288a3b337dc553baE4d427D706045a6fd92De9e" as `0x${string}`;

async function main() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account,
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
  // console.log("Deploying CallOracle contract");
  // const hash = await deployer.deployContract({
  //   abi,
  //   bytecode: bytecode as `0x${string}`,
  //   args: ["0x199839a4907ABeC8240D119B606C98c405Bb0B33"],
  // });
  // console.log("Transaction hash:", hash);
  // console.log("Waiting for confirmations...");
  // const receipt = await publicClient.waitForTransactionReceipt({ hash });
  // console.log("CallOracle contract deployed to:", receipt.contractAddress);

  const btcSpotPrice = await publicClient.readContract({
    address: CALL_ORACLE_CONTRACT_ADDRESS,
    abi,
    functionName: "getBtcSpotPrice",
    // args: [360 * 60 * 24 * 90],
    args: [360 * 60 * 24 * 90],
  });

  console.log(`The last value for BTC Spot Price is ${btcSpotPrice}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
