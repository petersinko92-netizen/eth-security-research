import pkg from 'hardhat';
const { ethers } = pkg;
import "dotenv/config";

async function main() {
    // Rely on the HTTP RPC URL from the .env to maintain consistency
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(`[Deployer] Starting native EIP-2612 Wallet Setup: ${deployer.address}`);

    const balance = await provider.getBalance(deployer.address);
    console.log(`[Deployer] Account Balance: ${ethers.formatEther(balance)} ETH`);

    // Compile and Deploy the new MockUSDC token (equipped with Native Permits)
    const tokenFactory = await ethers.getContractFactory("MockUSDC", deployer);
    const token = await tokenFactory.deploy();

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    console.log(`\n[✔ SUCCESS] MockUSDC natively endowed with EIP-2612 Permits deployed to:`);
    console.log(`--> ${tokenAddress} <--`);
    console.log(`\n[!] Update your .env file with TOKEN_ADDRESS=${tokenAddress}`);

    // Let's immediately mint some to the deployer for testing the claim
    console.log(`\n[*] Minting 10,000 MockUSDC to the deployer wallet for testing...`);
    const amountToMint = ethers.parseUnits("10000", 6);
    const mintTx = await token.mint(deployer.address, amountToMint);
    await mintTx.wait();

    console.log(`[✔ SUCCESS] 10,000 MockUSDC Minted.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
