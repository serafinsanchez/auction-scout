import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import parse from 'html-react-parser';
import AIEstimation from './AIEstimation';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import { Card, CardContent } from './ui/Card';
import { Heading, Paragraph, Text } from './ui/Typography';
import { BadgeDollarSign, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from './ui/Table';

function AuctionItems() {
  const [items, setItems] = useState([]);
  const [auctionDetails, setAuctionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCardView, setIsCardView] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const { id } = useParams();

  useEffect(() => {
    fetchAuctionItems();
  }, [id]);

  const fetchAuctionItems = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all auctions and find the one with the matching ID
      const auctionsResponse = await fetch('http://localhost:3001/api/auctions');
      if (!auctionsResponse.ok) {
        throw new Error(`HTTP error! status: ${auctionsResponse.status}`);
      }
      const auctionsData = await auctionsResponse.json();
      const foundAuction = auctionsData.find(a => a.id === id || a.id === String(id));
      setAuctionDetails(foundAuction || null);

      // Fetch items for this auction
      const itemsResponse = await fetch(`http://localhost:3001/api/items?auctionId=${id}`);
      if (!itemsResponse.ok) {
        throw new Error(`HTTP error! status: ${itemsResponse.status}`);
      }
      const itemsData = await itemsResponse.json();
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching auction items:', error);
      setError('Failed to fetch auction items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const cleanHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const downloadCSV = () => {
    const csvData = items.map((item) => {
      let description = item.description ? cleanHtml(item.description) : "";
      if (description === "No description available") {
        description = "";
      }

      return {
        id: item.id,
        name: item.name || 'Unnamed Item',
        description: description.replace(/,/g, ';'),
        startAmount: item.start_amount ? formatCurrency(item.start_amount) : 'N/A',
        currentBid: item.api_bidding_state && item.api_bidding_state.high ? formatCurrency(item.api_bidding_state.high.amount) : formatCurrency(0),
        bidCount: item.api_bidding_state ? item.api_bidding_state.accepted_bid_count : 0,
      };
    });

    const headers = ['ID', 'Name', 'Description', 'Start Amount', 'Current Bid', 'Bid Count'];
    const csvContent = 'data:text/csv;charset=utf-8,' +
      headers.join(',') + '\n' +
      csvData.map((row) => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'auction_items.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ImageCarousel = ({ images }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    return (
      <div className="relative w-full aspect-[4/3] rounded-t-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        {images.map((image, index) => (
          <img
            key={image.id}
            src={image.web_large_url}
            alt={`Item Image ${index + 1}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ borderRadius: 'inherit' }}
          />
        ))}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-md"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${idx === currentImageIndex ? 'bg-slate-900 dark:bg-slate-100 scale-125 shadow' : 'bg-slate-400 dark:bg-slate-600 opacity-60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const BiddingHistory = ({ bids }) => (
    <table className="mt-4 w-full">
      <thead>
        <tr>
          <th className="px-4 py-2 text-left">Bidder</th>
          <th className="px-4 py-2 text-left">Bid</th>
          <th className="px-4 py-2 text-left">Time</th>
        </tr>
      </thead>
      <tbody>
        {bids.map((bid) => (
          <tr key={bid.id}>
            <td className="border px-4 py-2">{bid.bidder_id}</td>
            <td className="border px-4 py-2">${bid.amount.toFixed(2)}</td>
            <td className="border px-4 py-2">{new Date(bid.timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const sortItems = (items, sortConfig) => {
    return [...items].sort((a, b) => {
      if (sortConfig.key === 'currentBid') {
        const aValue = a.api_bidding_state && a.api_bidding_state.high ? a.api_bidding_state.high.amount : 0;
        const bValue = b.api_bidding_state && b.api_bidding_state.high ? b.api_bidding_state.high.amount : 0;
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      } else if (sortConfig.key === 'bidCount') {
        const aValue = a.api_bidding_state ? a.api_bidding_state.accepted_bid_count : 0;
        const bValue = b.api_bidding_state ? b.api_bidding_state.accepted_bid_count : 0;
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      // Default sort by name
      const aValue = a.name || 'Unnamed Item';
      const bValue = b.name || 'Unnamed Item';
      return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const CardView = ({ items }) => {
    const [expandedDesc, setExpandedDesc] = useState({});
    const sortedItems = sortItems(items, sortConfig);
    const toggleDesc = (id) => setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
    return (
      <>
        <div className="mb-4 flex justify-end">
          <select 
            onChange={(e) => requestSort(e.target.value)}
            className="px-4 py-2 border rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="name">Sort by Name</option>
            <option value="currentBid">Sort by Current Bid</option>
            <option value="bidCount">Sort by Bid Count</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedItems.map((item, idx) => (
            <Card key={item.id} className="glass-card p-0 motion-safe:animate-fade-in-up [animation-delay:${idx * 60}ms] transition-transform duration-200 hover:scale-[1.02] hover:shadow-2xl max-w-md mx-auto shadow-blue-100 dark:shadow-slate-900">
              <CardContent className="p-8">
                {item.images && item.images.length > 0 && (
                  <div className="relative h-56 w-full rounded-t-xl overflow-hidden">
                    <ImageCarousel images={item.images} />
                  </div>
                )}
                <div className="p-6 flex flex-col gap-2">
                  <Heading level={4} className="mb-1">{item.name || 'Unnamed Item'}</Heading>
                  <Paragraph className={`${expandedDesc[item.id] ? '' : 'line-clamp-3'} min-h-[3.5em]`}>{item.description ? cleanHtml(item.description) : 'No description available'}</Paragraph>
                  {item.description && item.description.length > 120 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1 text-slate-700 dark:text-slate-300 underline w-fit"
                      onClick={() => toggleDesc(item.id)}
                    >
                      {expandedDesc[item.id] ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                  <div className="flex flex-row items-center justify-between gap-2 mt-4 mb-2">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Start</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{item.start_amount ? formatCurrency(item.start_amount) : 'N/A'}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Bid</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{item.api_bidding_state && item.api_bidding_state.high ? formatCurrency(item.api_bidding_state.high.amount) : formatCurrency(0)}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bids</span>
                      <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 text-sm font-semibold">{item.api_bidding_state ? item.api_bidding_state.accepted_bid_count : 0}</span>
                    </div>
                  </div>
                  <AIEstimation
                    itemName={item.name || 'Unnamed Item'}
                    itemDescription={item.description || 'No description available'}
                    imageLinks={item.images ? item.images.map(img => img.web_large_url) : []}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <a href={`https://bid.dickensheet.com/ui/auctions/${id}/${item.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="flex items-center gap-2">
                      View Details <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const ListView = ({ items }) => {
    const toggleExpand = (itemId) => {
      setExpandedRows((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    };
    const sortedItems = React.useMemo(() => {
      let sortableItems = [...items];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];

          if (sortConfig.key === 'currentBid') {
            aValue = a.api_bidding_state && a.api_bidding_state.high ? a.api_bidding_state.high.amount : 0;
            bValue = b.api_bidding_state && b.api_bidding_state.high ? b.api_bidding_state.high.amount : 0;
          } else if (sortConfig.key === 'bidCount') {
            aValue = a.api_bidding_state ? a.api_bidding_state.accepted_bid_count : 0;
            bValue = b.api_bidding_state ? b.api_bidding_state.accepted_bid_count : 0;
          } else if (sortConfig.key === 'name') {
            aValue = a.name || 'Unnamed Item';
            bValue = b.name || 'Unnamed Item';
          }

          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
      }
      return sortableItems;
    }, [items, sortConfig]);

    return (
      <div className="glass-card overflow-x-auto p-0 mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead onClick={() => requestSort('currentBid')}>{auctionDetails && auctionDetails.active ? 'Current Bid' : 'Final Bid'} {sortConfig.key === 'currentBid' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</TableHead>
              <TableHead onClick={() => requestSort('bidCount')}>Bids {sortConfig.key === 'bidCount' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</TableHead>
              <TableHead>Estimation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <TableRow className={`motion-safe:animate-fade-in-up [animation-delay:${idx * 60}ms] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.images && item.images.length > 0 && (
                        <img src={item.images[0].web_thumb_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover shadow" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name || 'Unnamed Item'}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[180px]">{item.description ? cleanHtml(item.description) : 'No description'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      {item.api_bidding_state && item.api_bidding_state.high ? formatCurrency(item.api_bidding_state.high.amount) : formatCurrency(0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 text-sm font-semibold">
                      {item.api_bidding_state ? item.api_bidding_state.accepted_bid_count : 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow">
                      <BadgeDollarSign className="w-4 h-4" />
                      <AIEstimation
                        itemName={item.name || 'Unnamed Item'}
                        itemDescription={item.description || 'No description available'}
                        imageLinks={item.images ? item.images.map(img => img.web_large_url) : []}
                      />
                    </span>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://bid.dickensheet.com/ui/auctions/${id}/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" /> View
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => toggleExpand(item.id)}
                      aria-label={expandedRows[item.id] ? 'Collapse details' : 'Expand details'}
                    >
                      {expandedRows[item.id] ? <AiOutlineUp /> : <AiOutlineDown />}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows[item.id] && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-slate-50 dark:bg-slate-900">
                      <div className="flex flex-col md:flex-row gap-6 py-4">
                        <div className="flex-1">
                          <Paragraph className="mb-2 text-slate-700 dark:text-slate-300">
                            {item.description ? cleanHtml(item.description) : 'No description available'}
                          </Paragraph>
                          {item.images && item.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.images.map((img, i) => (
                                <img key={i} src={img.web_thumb_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover shadow" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  if (!auctionDetails || items.length === 0) {
    return <div className="text-center py-10">No auction items found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Redesigned Auction Header/Actions */}
      <Card className="glass-card mb-8 p-0 shadow-xl border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 px-8 py-6">
          {/* Info Section */}
          <div className="flex flex-col gap-2 min-w-[220px]">
            <Link to="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-300 hover:underline text-sm font-medium mb-1">
              <ChevronLeft className="w-4 h-4" /> Back to Auctions
            </Link>
            {auctionDetails && (
              <>
                <Heading level={3} className="font-bold text-slate-900 dark:text-slate-100 mb-1">{auctionDetails.name}</Heading>
                <Paragraph className="text-slate-700 dark:text-slate-300 text-base font-medium">Total Items: <span className="font-semibold">{auctionDetails.items_count}</span></Paragraph>
                <Paragraph className="text-slate-700 dark:text-slate-300 text-base font-medium">End Time: <span className="font-semibold">{new Date(auctionDetails.scheduled_end_time).toLocaleString()}</span></Paragraph>
              </>
            )}
          </div>
          {/* Actions Section */}
          <div className="flex flex-row gap-4 w-full md:w-auto justify-end">
            <Button onClick={downloadCSV} variant="secondary" className="flex items-center gap-2 font-semibold shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8" /></svg>
              Download CSV
            </Button>
            <Button onClick={() => setIsCardView(!isCardView)} variant="outline" className="flex items-center gap-2 font-semibold shadow-md">
              {isCardView ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="6" width="16" height="4" rx="2"/><rect x="4" y="14" width="16" height="4" rx="2"/></svg>
              )}
              {isCardView ? 'Switch to List View' : 'Switch to Card View'}
            </Button>
          </div>
        </div>
      </Card>
      {/* End Redesigned Auction Header/Actions */}
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Auction Items</h3>
      
      {items.length === 0 ? (
        <p className="text-gray-600">No items found for this auction.</p>
      ) : (
        isCardView ? (
          <CardView items={items} />
        ) : (
          <ListView items={items} />
        )
      )}
    </div>
  );
}

export default AuctionItems;