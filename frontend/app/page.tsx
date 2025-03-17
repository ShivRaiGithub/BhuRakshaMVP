
// pages/index.js

'use client';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [landCount, setLandCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
  const CONTRACT_ABI = [
    "function userExists(address) external view returns (bool)",
    "function landCount() external view returns (uint256)"
  ];

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      setLoading(true);
      
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          
          // Check if user is registered
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          
          const registered = await contract.userExists(accounts[0]);
          setIsRegistered(registered);
          
          // Get land count
          const count = await contract.landCount();
          setLandCount(count.toNumber());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function connectWallet() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
        checkConnection();
      } else {
        alert('Please install MetaMask to use this application');
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Land Registry DApp</title>
        <meta name="description" content="Decentralized Land Registry Application" />
      </Head>

      <header className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Land Registry DApp</h1>
          <div>
            {isConnected ? (
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Decentralized Land Registry</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Register, buy, sell, and track land ownership on the blockchain
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-xl font-semibold mb-2">Total Registered Lands</h3>
                <p className="text-3xl font-bold text-blue-600">{landCount}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <h3 className="text-xl font-semibold mb-2">Your Account Status</h3>
                <p className="text-3xl font-bold text-green-600">
                  {isRegistered ? 'Registered' : 'Not Registered'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!isRegistered && (
                <Link href="/register-user" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-3 text-blue-600">Register as User</h3>
                  <p className="text-gray-600 mb-4">Create a user profile to start using the land registry</p>
                  <span className="text-blue-500 font-medium">Get Started →</span>
                </Link>
              )}

              {isRegistered && (
                <>
                  <Link href="/register-land" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold mb-3 text-blue-600">Register Land</h3>
                    <p className="text-gray-600 mb-4">Add your land property to the blockchain registry</p>
                    <span className="text-blue-500 font-medium">Register Now →</span>
                  </Link>

                  <Link href="/sell-land" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold mb-3 text-blue-600">Sell Land</h3>
                    <p className="text-gray-600 mb-4">List your registered lands for sale on the marketplace</p>
                    <span className="text-blue-500 font-medium">List Property →</span>
                  </Link>

                  <Link href="/buy-land" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold mb-3 text-blue-600">Buy Land</h3>
                    <p className="text-gray-600 mb-4">Browse and purchase lands available for sale</p>
                    <span className="text-blue-500 font-medium">Explore Market →</span>
                  </Link>
                </>
              )}

              <Link href="/land-history" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-blue-600">Land History</h3>
                <p className="text-gray-600 mb-4">View ownership history and details of any registered land</p>
                <span className="text-blue-500 font-medium">Search Records →</span>
              </Link>
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2025 Land Registry DApp. All rights reserved.</p>
          <p className="mt-2 text-gray-400 text-sm">Built on Ethereum blockchain</p>
        </div>
      </footer>
    </div>
  );
}