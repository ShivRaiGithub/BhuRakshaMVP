
// pages/buy-land.js
'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';
import Link from 'next/link';

export default function BuyLand() {
  const [landsForSale, setLandsForSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingLand, setBuyingLand] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
  const CONTRACT_ABI = [
    "function getLandsForSale() external view returns (uint256[] memory)",
    "function lands(uint256) external view returns (tuple(tuple(address userAddress, string name, string email, string phone, string aadhar, bool isRegistered) owner, string addressOfLand, tuple(address userAddress, string name, string email, string phone, string aadhar, bool isRegistered) registeredBy, uint256 registryDateAndTime, uint256 area, uint256 landId, bool isForSale, uint256 price))",
    "function buyLand(uint256 _landId) external payable",
    "function userExists(address) external view returns (bool)"
  ];

  useEffect(() => {
    fetchLandsForSale();
  }, []);

  async function fetchLandsForSale() {
    try {
      setLoading(true);
      setError('');
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Get all lands for sale
      const landIds = await contract.getLandsForSale();
      
      // Get details for each land
      const landsDetails = await Promise.all(
        landIds.map(async (id) => {
          const details = await contract.lands(id);
          return {
            id: details.landId.toString(),
            addressOfLand: details.addressOfLand,
            area: ethers.utils.formatUnits(details.area, 'wei'),
            owner: {
              address: details.owner.userAddress,
              name: details.owner.name
            },
            price: ethers.utils.formatEther(details.price),
            priceWei: details.price
          };
        })
      );
      
      setLandsForSale(landsDetails);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching lands for sale');
    } finally {
      setLoading(false);
    }
  }

  async function buyLandHandler(landId, price) {
    try {
      setBuyingLand(true);
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
        setError('You must register as a user before buying land');
        setBuyingLand(false);
        return;
      }

      // Buy the land
      const tx = await contract.buyLand(landId, {
        value: price
      });
      await tx.wait();
      
      setSuccess('Land purchased successfully!');
      // Refresh the list
      fetchLandsForSale();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while buying land');
    } finally {
      setBuyingLand(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Head>
        <title>Buy Land - Land Registry</title>
      </Head>
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Buy Land</h1>
          
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
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Available Lands</h2>
            <button
              onClick={fetchLandsForSale}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading available lands...</p>
            </div>
          ) : landsForSale.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {landsForSale.map((land) => (
                <div key={land.id} className="border rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium mb-2">Land ID: {land.id}</h3>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Address:</span> {land.addressOfLand}</p>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Area:</span> {land.area} sq. meters</p>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Owner:</span> {land.owner.name}</p>
                  <p className="text-xl font-bold text-blue-600 my-3">{land.price} ETH</p>
                  <button
                    onClick={() => buyLandHandler(land.id, land.priceWei)}
                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={buyingLand}
                  >
                    {buyingLand ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600">No lands available for sale at the moment.</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
