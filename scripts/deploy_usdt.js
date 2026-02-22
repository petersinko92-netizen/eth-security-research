import pkg from 'hardhat';
const { ethers } = pkg;
import "dotenv/config";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(`[Deployer] Starting Legacy ERC-20 Toolkit Setup (No Permits): ${deployer.address}`);

    const balance = await provider.getBalance(deployer.address);
    console.log(`[Deployer] Account Balance: ${ethers.formatEther(balance)} ETH`);

    // Compile and Deploy the legacy MockUSDT token
    const tokenFactory = await ethers.getContractFactory("MockUSDT", deployer);
    const token = await tokenFactory.deploy();

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    console.log(`\n[✔ SUCCESS] Legacy MockUSDT deployed to:`);
    console.log(`--> ${tokenAddress} <--`);
    console.log(`\n[!] Update your .env file with TOKEN_ADDRESS=${tokenAddress}`);

    console.log(`\n[*] Minting 10,000 legacy MockUSDT to the deployer wallet...`);
    const amountToMint = ethers.parseUnits("10000", 6);
    const mintTx = await token.mint(deployer.address, amountToMint);
    await mintTx.wait();

    console.log(`[✔ SUCCESS] 10,000 MockUSDT Minted.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
