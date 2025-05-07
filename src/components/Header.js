import React from 'react';
import { Link } from 'react-router-dom';
import logo from './auction_logo.png'; // Import the logo

function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 mr-2" />
          <h1 className="text-xl font-bold">Auction Ninja</h1>
        </Link>
        <nav>
          <Link to="/" className="hover:text-gray-300">Home</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;