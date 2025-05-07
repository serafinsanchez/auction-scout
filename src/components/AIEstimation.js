import React, { useState } from 'react';
import axios from 'axios';
import { Heading, Paragraph, Text } from './ui/Typography';
import { BadgeDollarSign } from 'lucide-react';

const AIEstimation = ({ itemName, itemDescription, imageLinks }) => {
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEstimation, setShowEstimation] = useState(false);

  const getAIEstimation = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching estimation for:', { itemName, itemDescription, imageLinks });
      const response = await axios.post('http://localhost:3001/ai-estimation', {
        itemName,
        itemDescription,
        imageLinks,
      });

      console.log('Response received:', response.data);
      setEstimation(response.data);
      setShowEstimation(true);
    } catch (err) {
      console.error('Detailed error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error data:', err.response.data);
        console.error('Error status:', err.response.status);
        console.error('Error headers:', err.response.headers);
        setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        setError('No response received from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', err.message);
        setError(`Failed to get AI estimation: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!showEstimation && !loading && (
        <button
          onClick={estimation ? () => setShowEstimation(true) : getAIEstimation}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow"
        >
          Get Estimated Value
        </button>
      )}
      {loading && <span className="text-xs text-slate-500">Loading...</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
      {showEstimation && estimation && (
        <div
          className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow motion-safe:animate-fade-in-up"
          style={{ background: 'none', backgroundImage: 'none' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BadgeDollarSign className="w-6 h-6 text-slate-600 dark:text-slate-200" />
            <Heading level={4} className="text-slate-800 dark:text-slate-100 text-2xl font-extrabold mb-0">{estimation.valueRange}</Heading>
            <button
              onClick={() => setShowEstimation(false)}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
              style={{ fontSize: '0.85em' }}
            >
              Collapse
            </button>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
          <div className="mb-3">
            <Text className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Summary</Text>
            <Paragraph className="text-slate-600 dark:text-slate-400 mb-0 text-sm leading-relaxed">{estimation.context}</Paragraph>
          </div>
          <div>
            <Text className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Demand</Text>
            <Paragraph className="text-slate-600 dark:text-slate-400 mb-0 text-sm leading-relaxed">{estimation.demand}</Paragraph>
          </div>
          {estimation.specialConsiderations && (
            <div className="mt-3">
              <Text className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Special Considerations</Text>
              <Paragraph className="text-slate-600 dark:text-slate-400 mb-0 text-sm leading-relaxed">{estimation.specialConsiderations}</Paragraph>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIEstimation;