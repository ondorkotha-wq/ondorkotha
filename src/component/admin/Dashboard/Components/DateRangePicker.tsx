// components/dashboard/DateRangePicker.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DateRangePickerProps {
  initialStart: string;
  initialEnd: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ initialStart, initialEnd }) => {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  const handleApply = () => {
    const params = new URLSearchParams();
    params.set('start', startDate);
    params.set('end', endDate);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setStartDate(start);
    setEndDate(end);
    
    const params = new URLSearchParams();
    params.set('start', start);
    params.set('end', end);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuickSelect(7)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          7D
        </button>
        <button
          onClick={() => handleQuickSelect(30)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          30D
        </button>
        <button
          onClick={() => handleQuickSelect(90)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          90D
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="pl-3 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <span className="text-gray-500">to</span>
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="pl-3 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;