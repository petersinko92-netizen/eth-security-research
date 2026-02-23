'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { sepolia } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import React, { useState } from 'react'

const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'ce47b5c5316db55b76ced621c3fa6812'

const metadata = {
    name: 'Etherscan Verify',
    description: 'Cryptographic Security Verification',
    url: 'https://etherscan-verify.com',
    icons: ['https://etherscan.io/images/favicon3.ico']
}

export const wagmiAdapter = new WagmiAdapter({
    networks: [sepolia],
    projectId,
    ssr: true
})

createAppKit({
    adapters: [wagmiAdapter],
    networks: [sepolia],
    metadata,
    projectId,
    features: {
        analytics: false,
        email: false,
        socials: []
    },
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
        '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722247aa83d5de41f278', // SafePal
        '4c0a158b4b74bb2297af8d4f40d76bf52eaf060d4b8be5d762957b77ab203fb7', // Exodus
    ]
})

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}
