import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import parse from 'html-react-parser';

function AuctionDetails() {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    fetchAuctionDetails();
  }, [id]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      // Fetch all auctions and find the one with the matching ID
      const response = await fetch('http://localhost:3001/api/auctions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const foundAuction = data.find(a => a.id === id || a.id === String(id));
      setAuction(foundAuction || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching auction details:', error);
      setError('Failed to fetch auction details. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!auction) return <div className="text-center py-10">No auction found</div>;

  const webLargeImage = auction.featured_images.find(img => img.type === 'web_large');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">&larr; Back to Auctions</Link>
      
      <h1 className="text-4xl font-bold mb-6 text-gray-900">{auction.name}</h1>
      
      {webLargeImage && (
        <img src={webLargeImage.web_large_url} alt={auction.name} className="w-full h-80 object-cover rounded-lg mb-8 shadow-lg" />
      )}

      <Link 
        to={`/auction/${auction.id}/items`} 
        className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition duration-300 mb-8 inline-block shadow-md"
      >
        View Auction Items
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Description</h2>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Auction Contents</h3>
            <p className="text-gray-600">{auction.description ? parse(String(auction.description)) : 'No description available.'}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Auction Details</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>On Behalf Of: {auction.company_name}</li>
              <li>Date: {new Date(auction.starts_at).toLocaleDateString()} - {new Date(auction.starts_at).toLocaleTimeString()}</li>
              <li>Inspection: {auction.inspection_details || 'Not specified'}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Important Dates</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>End Time: {new Date(auction.scheduled_end_time).toLocaleString()}</li>
              <li>Removal Deadline: {auction.removal_details || 'Not specified'}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Buyer Responsibilities</h3>
            <p className="text-gray-600">{auction.buyer_responsibilities || 'Please contact the auction house for details.'}</p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Auction Information</h2>
          <InfoItem label="Status" value={auction.status} />
          <InfoItem label="Type" value={auction.online_only ? 'Online Only' : auction.offline_only ? 'Offline Only' : 'Mixed'} />
          <InfoItem label="Start Time" value={new Date(auction.starts_at).toLocaleString()} />
          <InfoItem label="End Time" value={new Date(auction.scheduled_end_time).toLocaleString()} />
          <InfoItem label="Timezone" value={auction.timezone} />
          <InfoItem label="Items Count" value={auction.items_count} />
          <InfoItem label="Coordinator" value={`${auction.coord_first_name} ${auction.coord_last_name}`} />
          <InfoItem label="Email" value={auction.coord_email} />
          <InfoItem label="Phone" value={auction.coord_phone || 'N/A'} />
        </div>
                
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4 md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Location</h2>
          {auction.location ? (
            <>
              <p className="text-gray-700">{auction.location.street}</p>
              <p className="text-gray-700">{auction.location.city}, {auction.location.state} {auction.location.zip}</p>
              <p className="text-gray-700">{auction.location.country}</p>
              <p className="text-gray-700">
                <span className="font-semibold">Coordinates:</span> Lat: {auction.location.lat}, Lng: {auction.location.lng}
              </p>
              <a href={`https://maps.google.com/?q=${auction.location.lat},${auction.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                View on Google Maps
              </a>
            </>
          ) : (
            <p className="text-gray-700">Location information not available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <p className="text-gray-700">
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

export default AuctionDetails;