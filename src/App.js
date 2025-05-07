import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuctionList from './components/AuctionList';
import AuctionDetails from './components/AuctionDetails';
import AuctionItems from './components/AuctionItems';
import AIEstimations from './components/AIEstimation';
import ClientOnly from './components/ClientOnly';
import ThemeToggle from './components/ThemeToggle';
import { Menubar, MenubarMenu, MenubarTrigger, MenubarItem } from './components/ui/Menubar';
import { Link } from 'react-router-dom';
import './index.css'; // Import the Tailwind CSS file
import { Logo } from './components/ui/Logo';

function App() {
  return (
    <Router>
      <div className="App">
        <main className="p-4">
          <Menubar className="mb-6 px-4 py-2 flex items-center gap-8">
            <Logo className="w-8 h-8 mr-4" />
            <MenubarMenu>
              <Link to="/">
                <MenubarTrigger>Home</MenubarTrigger>
              </Link>
            </MenubarMenu>
            <div className="ml-auto flex items-center">
              <ThemeToggle />
            </div>
          </Menubar>
          <Routes>
            <Route path="/auction/:id" element={<ClientOnly><AuctionDetails /></ClientOnly>} />
            <Route path="/auction/:id/items" element={<ClientOnly><AuctionItems /></ClientOnly>} />
            <Route path="/" element={<ClientOnly><AuctionList /></ClientOnly>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
