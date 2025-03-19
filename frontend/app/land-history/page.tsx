
// pages/land-history.js
'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';
import Link from 'next/link';

export default function LandHistory() {
  const [addressOfLand, setAddressOfLand] = useState('');
  const [landId, setLandId] = useState(null);
  const [landDetails, setLandDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');

  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
  const CONTRACT_ABI = [
    "function landExists(string) external view returns (uint256)",
    "function lands(uint256) external view returns (tuple(tuple(address userAddress, string name, string email, string phone, string aadhar, bool isRegistered) owner, string addressOfLand, tuple(address userAddress, string name, string email, string phone, string aadhar, bool isRegistered) registeredBy, uint256 registryDateAndTime, uint256 area, uint256 landId, bool isForSale, uint256 price))",
    "event LandRegistered(uint256 indexed landId, address owner, string addressOfLand, address registeredBy, uint256 registryDateAndTime, uint256 area)",
    "event LandPurchased(uint256 indexed landId, address oldOwner, address newOwner, uint256 price, uint256 timestamp)"
  ];

  async function searchLandHandler(e) {
    e.preventDefault();
    
    if (!addressOfLand) {
      setError('Please enter a land address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setLandId(null);
      setLandDetails(null);
      setHistory([]);
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Get land ID from address
      const id = await contract.landExists(addressOfLand);
      if (id.toString() === '0') {
        setError('Land with this address does not exist');
        setSearchPerformed(true);
        setLoading(false);
        return;
      }
      
      setLandId(id.toString());
      
      // Get land details
      const details = await contract.lands(id);
      setLandDetails({
        id: details.landId.toString(),
        addressOfLand: details.addressOfLand,
        area: ethers.utils.formatUnits(details.area, 'wei'),
        owner: {
          address: details.owner.userAddress,
          name: details.owner.name
        },
        registeredBy: {
          address: details.registeredBy.userAddress,
          name: details.registeredBy.name
        },
        registryDateAndTime: new Date(details.registryDateAndTime.toNumber() * 1000).toLocaleString(),
        isForSale: details.isForSale,
        price: details.isForSale ? ethers.utils.formatEther(details.price) : '0'
      });
      
      // Get land history from events
      const registrationFilter = contract.filters.LandRegistered(id);
      const purchaseFilter = contract.filters.LandPurchased(id);
      
      const registrationEvents = await contract.queryFilter(registrationFilter);
      const purchaseEvents = await contract.queryFilter(purchaseFilter);
      
      // Combine and sort events by timestamp
      const allEvents = [
        ...registrationEvents.map(event => {
          const { owner, addressOfLand, registeredBy, registryDateAndTime } = event.args;
          return {
            type: 'Registration',
            timestamp: registryDateAndTime.toNumber(),
            date: new Date(registryDateAndTime.toNumber() * 1000).toLocaleString(),
            owner,
            registeredBy
          };
        }),
        ...purchaseEvents.map(event => {
          const { oldOwner, newOwner, price, timestamp } = event.args;
          return {
            type: 'Purchase',
            timestamp: timestamp.toNumber(),
            date: new Date(timestamp.toNumber() * 1000).toLocaleString(),
            oldOwner,
            newOwner,
            price: ethers.utils.formatEther(price)
          };
        })
      ].sort((a, b) => a.timestamp - b.timestamp);
      
      setHistory(allEvents);
      setSearchPerformed(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while searching for land');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Head>
        <title>Land History - Land Registry</title>
      </Head>
  
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Land Ownership History</h1>
  
          {error && (
            <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 font-semibold">
              {error}
            </div>
          )}
  
          <form onSubmit={searchLandHandler} className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              className="flex-grow px-4 py-2 border border-gray-400 rounded-md text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the land address"
              value={addressOfLand}
              onChange={(e) => setAddressOfLand(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
  
        {searchPerformed && !error && (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            {landDetails ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Land Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-gray-800">
                  <div>
                    <p><span className="font-semibold">Land ID:</span> {landDetails.id}</p>
                    <p><span className="font-semibold">Address:</span> {landDetails.addressOfLand}</p>
                    <p><span className="font-semibold">Area:</span> {landDetails.area} sq. meters</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">Current Owner:</span> {landDetails.owner.name} ({landDetails.owner.address.substring(0, 8)}...)</p>
                    <p><span className="font-semibold">Registration Date:</span> {landDetails.registryDateAndTime}</p>
                    <p><span className="font-semibold">Status:</span> {landDetails.isForSale ? `For Sale (${landDetails.price} ETH)` : 'Not for Sale'}</p>
                  </div>
                </div>
  
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ownership History</h2>
                {history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-300">
                        {history.map((event, index) => (
                          <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${event.type === 'Registration' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                                {event.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {event.date}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {event.type === 'Registration' ? (
                                <span>Registered by {event.registeredBy.substring(0, 8)}...</span>
                              ) : (
                                <span>Transferred from {event.oldOwner.substring(0, 8)}... to {event.newOwner.substring(0, 8)}... for {event.price} ETH</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-700 font-medium">No ownership transfer history found.</p>
                )}
              </>
            ) : (
              <p className="text-center text-gray-700 font-medium">No land found with this address.</p>
            )}
          </div>
        )}
  
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}  