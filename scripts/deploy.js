import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const usdtAddress = await usdt.getAddress();
    console.log("MockUSDT deployed to:", usdtAddress);

    // Optional: Mint some initial tokens to the deployer or a test victim wallet
    // This can be done here or in a separate script.
    // We mint 1000 USDT (with 6 decimals) to the deployer for now
    const mintAmount = ethers.parseUnits("1000", 6);
    await usdt.mint(deployer.address, mintAmount);
    console.log("Minted 1000 USDT to:", deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
