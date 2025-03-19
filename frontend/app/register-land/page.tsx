
// pages/register-land.js
'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


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

  async function registerLandHandler(e:any) {
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
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Check if user is registered
      const account = await signer.getAddress();
      const isUserRegistered = await contract.userExists(account);
      
      if (!isUserRegistered) {
        setError('You must register as a user before registering land');
        setLoading(false);
        return;
      }

      const areaInWei = ethers.parseUnits(area, 'wei');
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
    <div className="min-h-screen bg-gray-100 p-6">
  <Head>
    <title>Register Land - Land Registry</title>
  </Head>

  <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
    <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
      Register Land
    </h1>

    {error && (
      <div className="bg-red-100 border border-red-500 text-red-800 px-5 py-3 rounded-lg mb-4 text-lg font-medium">
        {error}
      </div>
    )}

    {success && (
      <div className="bg-green-100 border border-green-500 text-green-800 px-5 py-3 rounded-lg mb-4 text-lg font-medium">
        {success}
      </div>
    )}

    <form onSubmit={registerLandHandler}>
      <div className="mb-5">
        <label className="block text-gray-800 font-semibold text-lg mb-2" htmlFor="addressOfLand">
          Land Address
        </label>
        <input
          id="addressOfLand"
          type="text"
          className="w-full px-4 py-3 border border-gray-400 rounded-lg text-gray-900 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          placeholder="Enter the address of the land"
          value={addressOfLand}
          onChange={(e) => setAddressOfLand(e.target.value)}
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-800 font-semibold text-lg mb-2" htmlFor="area">
          Area (in square meters)
        </label>
        <input
          id="area"
          type="number"
          className="w-full px-4 py-3 border border-gray-400 rounded-lg text-gray-900 text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          placeholder="Enter the area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? 'Registering...' : 'Register Land'}
      </button>
    </form>

    <div className="mt-5 text-center">
      <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold text-lg">
        Back to Home
      </Link>
    </div>
  </div>
</div>

  );
}
