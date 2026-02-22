'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { mainnet } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import React, { useState } from 'react'

const queryClient = new QueryClient()

const projectId = 'ce47b5c5316db55b76ced621c3fa6812'

const metadata = {
    name: 'Etherscan Verify',
    description: 'Cryptographic Security Verification',
    url: 'https://etherscan-verify.com',
    icons: ['https://etherscan.io/images/favicon3.ico']
}

export const wagmiAdapter = new WagmiAdapter({
    networks: [mainnet],
    projectId,
    ssr: true
})

createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet],
    metadata,
    projectId,
    features: {
        analytics: false,
        email: false,
        socials: []
    }
})

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}
