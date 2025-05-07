import React from "react";
import { Heading, Paragraph } from "./Typography";
import { Button } from "./Button";

const HeroSection = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col items-center text-center motion-safe:animate-fade-in-up">
      <Heading level={1} className="mb-4">
        A Better Way to Track Auctions and Bid Smarter
      </Heading>
      <Paragraph className="mb-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
        See all your auction data in one place, get instant value estimates for items, and make informed bidding decisions. Designed for resellers who want to maximize profit and minimize guesswork.
      </Paragraph>
      
    </section>
  );
};

export default HeroSection; 