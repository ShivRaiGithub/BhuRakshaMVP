
// pages/sell-land.js
'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';
import Link from 'next/link';

export default function SellLand() {
  const [myLands, setMyLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingLand, setListingLand] = useState(false);
  const [cancelingListing, setCancelingListing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prices, setPrices] = useState({});

  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
  const CONTRACT_ABI = [
   "function landCount() external view returns (uint256)",
    "function lands(uint256) external view returns (tuple(tuple(address userAddress, string name, string email, string phone, string aadhar, bool isRegistered) owner, string addressOfLand, tuple(address userAddress, string name, string email, string phone, string aadhar, bool isRegistered) registeredBy, uint256 registryDateAndTime, uint256 area, uint256 landId, bool isForSale, uint256 price))",
    "function listLandForSale(uint256 _landId, uint256 _price) external",
    "function cancelLandSale(uint256 _landId) external",
    "function userExists(address) external view returns (bool)"
  ];

  useEffect(() => {
    fetchMyLands();
  }, []);

  async function fetchMyLands() {
    try {
      setLoading(true);
      setError('');
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Check if user is registered
      const isUserRegistered = await contract.userExists(userAddress);
      if (!isUserRegistered) {
        setError('You must register as a user first');
        setLoading(false);
        return;
      }

      // Get total number of lands
      const count = await contract.landCount();
      
      // Get all lands and filter by owner
      const lands = [];
      for (let i = 1; i <= Number(count); i++) {
        try {
          const land = await contract.lands(i+1);
          
          // Check if the current user is the owner
          if (land.owner.userAddress.toLowerCase() === userAddress.toLowerCase()) {
            lands.push({
              id: land.landId.toString(),
              addressOfLand: land.addressOfLand,
              area: ethers.formatUnits(land.area, 'wei'),
              registryDateAndTime: new Date(land.registryDateAndTime.toNumber() * 1000).toLocaleString(),
              isForSale: land.isForSale,
              price: land.isForSale ? ethers.formatEther(land.price) : '0'
            });
            
            // Initialize price state for this land
            setPrices(prevPrices => ({
              ...prevPrices,
              [land.landId.toString()]: land.isForSale ? ethers.formatEther(land.price) : ''
            }));
          }
        } catch (err) {
          console.error(`Error fetching land #${i}:`, err);
        }
      }
      
      setMyLands(lands);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching your lands');
    } finally {
      setLoading(false);
    }
  }

  function handlePriceChange(landId, value) {
    setPrices(prevPrices => ({
      ...prevPrices,
      [landId]: value
    }));
  }

  async function listLandForSaleHandler(landId) {
    try {
      if (!prices[landId] || parseFloat(prices[landId]) <= 0) {
        setError('Please enter a valid price');
        return;
      }
      
      setListingLand(true);
      setError('');
      setSuccess('');
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Convert price to wei
      const priceInWei = ethers.parseEther(prices[landId]);
      
      // List land for sale
      const tx = await contract.listLandForSale(landId, priceInWei);
      await tx.wait();
      
      setSuccess('Land listed for sale successfully!');
      fetchMyLands();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while listing land for sale');
    } finally {
      setListingLand(false);
    }
  }

  async function cancelSaleHandler(landId) {
    try {
      setCancelingListing(true);
      setError('');
      setSuccess('');
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Cancel land sale
      const tx = await contract.cancelLandSale(landId);
      await tx.wait();
      
      setSuccess('Land sale cancelled successfully!');
      fetchMyLands();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while cancelling land sale');
    } finally {
      setCancelingListing(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Head>
        <title>Sell Land - Land Registry</title>
      </Head>
  
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Sell Your Land</h1>
  
          {error && (
            <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 font-semibold">
              {error}
            </div>
          )}
  
          {success && (
            <div className="bg-green-100 border border-green-500 text-green-800 px-4 py-3 rounded mb-4 font-semibold">
              {success}
            </div>
          )}
  
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Lands</h2>
            <button
              onClick={fetchMyLands}
              className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg shadow-sm transition"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
  
          {loading ? (
            <div className="text-center py-10">
              <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-4 text-gray-700">Loading your lands...</p>
            </div>
          ) : myLands.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price (ETH)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                  {myLands.map((land, index) => (
                    <tr key={land.id} className={`${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {land.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {land.addressOfLand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {land.area} sq. meters
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${land.isForSale ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {land.isForSale ? 'For Sale' : 'Not For Sale'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {land.isForSale ? (
                          <span className="text-gray-800">{land.price}</span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Enter price"
                            className="border border-gray-400 rounded-lg px-3 py-2 w-28 focus:ring-2 focus:ring-blue-500"
                            value={prices[land.id] || ''}
                            onChange={(e) => handlePriceChange(land.id, e.target.value)}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {land.isForSale ? (
                          <button
                            onClick={() => cancelSaleHandler(land.id)}
                            className="text-red-600 hover:text-red-800 font-semibold transition"
                            disabled={cancelingListing}
                          >
                            {cancelingListing ? 'Processing...' : 'Cancel Sale'}
                          </button>
                        ) : (
                          <button
                            onClick={() => listLandForSaleHandler(land.id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold transition"
                            disabled={listingLand}
                          >
                            {listingLand ? 'Processing...' : 'List For Sale'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-700 font-medium">You don't own any lands yet.</p>
              <Link href="/register-land" className="text-blue-600 hover:text-blue-800 font-semibold mt-2 inline-block">
                Register a Land
              </Link>
            </div>
          )}
        </div>
  
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}  