
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
    <div className="min-h-screen bg-gray-100 p-4">
      <Head>
        <title>Land History - Land Registry</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Land Ownership History</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={searchLandHandler} className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter the address of the land"
              value={addressOfLand}
              onChange={(e) => setAddressOfLand(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline whitespace-nowrap"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        
        {searchPerformed && !error && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {landDetails ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Land Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p><span className="font-medium">Land ID:</span> {landDetails.id}</p>
                    <p><span className="font-medium">Address:</span> {landDetails.addressOfLand}</p>
                    <p><span className="font-medium">Area:</span> {landDetails.area} sq. meters</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Current Owner:</span> {landDetails.owner.name} ({landDetails.owner.address.substring(0, 8)}...)</p>
                    <p><span className="font-medium">Registration Date:</span> {landDetails.registryDateAndTime}</p>
                    <p><span className="font-medium">Status:</span> {landDetails.isForSale ? `For Sale (${landDetails.price} ETH)` : 'Not for Sale'}</p>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mb-4">Ownership History</h2>
                {history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((event, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${event.type === 'Registration' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {event.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.date}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
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
                  <p className="text-gray-500">No ownership transfer history found.</p>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500">No land found with this address.</p>
            )}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}