import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from './ui/Table';
import { Button } from './ui/Button';
import { Heading, Paragraph, Text } from './ui/Typography';
import { BarChart2, ShoppingBag, Users, Eye } from 'lucide-react';
import HeroSection from './ui/HeroSection';

function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [sortBy, setSortBy] = useState('starts_at');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const auctionsPerPage = 50;
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/auctions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // The backend returns an array of auctions
      setAuctions(data);
      setTotalPages(Math.ceil(data.length / auctionsPerPage));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setError('Failed to fetch auctions. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  const sortAuctions = (a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'id':
        comparison = (a.id || 0) - (b.id || 0);
        break;
      case 'name':
        comparison = (a.tag_line || '').localeCompare(b.tag_line || '');
        break;
      case 'items_count':
        comparison = (a.items_count || 0) - (b.items_count || 0);
        break;
      case 'starts_at':
        comparison = new Date(a.starts_at || 0) - new Date(b.starts_at || 0);
        break;
      case 'scheduled_end_time':
        comparison = new Date(a.scheduled_end_time || 0) - new Date(b.scheduled_end_time || 0);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastAuction = currentPage * auctionsPerPage;
  const indexOfFirstAuction = indexOfLastAuction - auctionsPerPage;
  const currentAuctions = auctions.slice(indexOfFirstAuction, indexOfLastAuction);

  const renderSortIcon = (column) => {
    if (sortBy === column) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 prose prose-slate dark:prose-invert">
      <HeroSection />
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 not-prose">
        <Heading level={2}>Active Auctions</Heading>
      </div>
      <Paragraph className="mb-8 not-prose text-lg text-slate-600 dark:text-slate-300">Browse and manage all ongoing auctions. Track items, bids, and participants in real time.</Paragraph>
      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('id')}>ID{renderSortIcon('id')}</TableHead>
              <TableHead onClick={() => handleSort('name')}>Name{renderSortIcon('name')}</TableHead>
              <TableHead onClick={() => handleSort('items_count')}>Items{renderSortIcon('items_count')}</TableHead>
              <TableHead onClick={() => handleSort('starts_at')}>Start{renderSortIcon('starts_at')}</TableHead>
              <TableHead onClick={() => handleSort('scheduled_end_time')}>End{renderSortIcon('scheduled_end_time')}</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAuctions.sort(sortAuctions).map((auction, idx) => (
              <TableRow key={auction.id} onClick={() => navigate(`/auction/${auction.id}/items`)} aria-label={`View items for auction ${auction.id}`} tabIndex={0} className={`motion-safe:animate-fade-in-up [animation-delay:${idx * 60}ms]`}>
                <TableCell>{auction.id}</TableCell>
                <TableCell>{auction.title || auction.name || auction.tag_line || 'Unnamed Auction'}</TableCell>
                <TableCell>{auction.items_count || 0}</TableCell>
                <TableCell>{auction.starts_at ? new Date(auction.starts_at).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>{auction.scheduled_end_time ? new Date(auction.scheduled_end_time).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                  <Button variant="ghost" className="text-green-600 dark:text-green-400 flex items-center gap-2" tabIndex={-1}>
                    <Eye className="w-4 h-4" /> View Items
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            className={currentPage === page ? '' : 'text-slate-700 dark:text-slate-200'}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default AuctionList;
