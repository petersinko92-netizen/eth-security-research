import pkg from 'hardhat';
const { ethers } = pkg;
import "dotenv/config";

async function main() {
    // Connect to Sepolia using HTTP RPC
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

    // For this simulation, we'll just use the same deployer wallet as the "victim"
    // In reality, Phase 1 gas injection would fund a different wallet 
    // and the phishing site would use window.ethereum to trigger this transaction.
    const victimWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // The malicious drainer address that the victim is tricked into approving
    const drainerAddress = victimWallet.address; // Normally different, using same for testing
    const tokenAddress = process.env.TOKEN_ADDRESS;

    console.log(`[🦊 Fake Phishing Site] Connecting Victim Wallet: ${victimWallet.address}`);

    const erc20Abi = [
        "function approve(address spender, uint256 amount) public returns (bool)"
    ];
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, victimWallet);

    const approveAmount = ethers.parseUnits("500", 6); // Mocking approval of 500 USDT

    console.log(`[💣 Triggering Exploit] Victim is tricked into calling approve()...`);
    console.log(`[-] Spender: ${drainerAddress}`);
    console.log(`[-] Amount: 500 USDT`);

    const tx = await tokenContract.approve(drainerAddress, approveAmount);
    console.log(`\n[📤 Transaction Broadcasted] Hash: ${tx.hash}`);
    console.log(`[*] Now check your Sniper Bot terminal! It should detect this in the mempool and sweep the funds after confirmation.`);

    await tx.wait();
    console.log(`[✔ Victim Transaction Mined] block confirmation received.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
