import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ComposedChart, Bar, Area, Tooltip } from 'recharts';

interface SparklineProps {
  salesData: ProductSales[];
  totalSalesVolume: number;
  totalReturns: number;
  isLoading: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ salesData, totalSalesVolume, totalReturns, isLoading }) => {

  if (isLoading) {
    return <div className="spinner"></div>; // Now correctly using isLoading to show the spinner
  }

  const dataWithCumulativeReturns = salesData.map((item, index, arr) => ({
    ...item,
    cumulativeReturns: arr.slice(0, index + 1).reduce((acc, cur) => acc + (cur.returns || 0), 0),
  }));

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      {/* Adjusted container for the 30-day Sales and its sparkline chart */}
      <div style={{ marginRight: '20px' }}>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${totalSalesVolume.toLocaleString()}</div>
          <div style={{ fontSize: '10px', fontWeight: 'normal' }}>30-day Sales</div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={salesData}>
            <XAxis dataKey="orderPlacedDate" hide />
            <YAxis hide />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Adjusted container for the 30-day Returns and its combined chart */}
      <div>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalReturns.toLocaleString()} units</div>
          <div style={{ fontSize: '10px', fontWeight: 'normal' }}>30-day Returns</div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={dataWithCumulativeReturns}>
            <XAxis dataKey="orderPlacedDate" hide />
            <YAxis hide />
            {/* <Tooltip /> */}
            <Area type="monotone" dataKey="cumulativeReturns" fill="#8884d8" stroke="#8884d8" />
            <Bar dataKey="returns" fill="yellow" barSize={10} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Sparkline;