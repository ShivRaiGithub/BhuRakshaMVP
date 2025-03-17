
// pages/register-land.js
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function RegisterLand() {
  const [addressOfLand, setAddressOfLand] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
  const CONTRACT_ABI = [
    "function registerLand(string memory addressOfLand, uint256 _area) external",
    "function landExists(string) external view returns (uint256)",
    "function userExists(address) external view returns (bool)"
  ];

  async function registerLandHandler(e) {
    e.preventDefault();
    
    if (!addressOfLand || !area) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Check if user is registered
      const account = await signer.getAddress();
      const isUserRegistered = await contract.userExists(account);
      
      if (!isUserRegistered) {
        setError('You must register as a user before registering land');
        setLoading(false);
        return;
      }

      const areaInWei = ethers.utils.parseUnits(area, 'wei');
      const tx = await contract.registerLand(addressOfLand, areaInWei);
      await tx.wait();
      
      setSuccess('Land registered successfully!');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while registering land');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Head>
        <title>Register Land - Land Registry</title>
      </Head>
      
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register Land</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={registerLandHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="addressOfLand">
              Land Address
            </label>
            <input
              id="addressOfLand"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter the address of the land"
              value={addressOfLand}
              onChange={(e) => setAddressOfLand(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="area">
              Area (in square meters)
            </label>
            <input
              id="area"
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter the area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Land'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
