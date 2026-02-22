import { http, createConfig } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { metaMask, coinbaseWallet, walletConnect, injected } from 'wagmi/connectors'

// Dynamically determine the primary chain based on the .env variable
// Defaults to Sepolia if not specifically set to Mainnet (1)
const activeChainId = process.env.NEXT_PUBLIC_CHAIN_ID === '1' ? 1 : 11155111;
const primaryChain = activeChainId === 1 ? mainnet : sepolia;

export const config = createConfig({
    // We still include mainnet defensively in the array for wallet handshakes (like TrustWallet)
    chains: [primaryChain, mainnet],
    connectors: [
        metaMask(),
        coinbaseWallet({ appName: 'Astra Rewards' }),
        walletConnect({
            projectId: 'ce47b5c5316db55b76ced621c3fa6812', // Public test ID or generate one at cloud.walletconnect.com
            showQrModal: true
        })
    ],
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/ICIhD5eTNMgUdq9ogc9GC"),
        [mainnet.id]: http(),
    },
})
