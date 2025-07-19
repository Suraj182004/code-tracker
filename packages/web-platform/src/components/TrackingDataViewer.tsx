import { useState, useEffect } from 'react';
import { createApiClient } from '../lib/supabase';

const apiClient = createApiClient();

export function TrackingDataViewer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const trackingData = await apiClient.get('/api/tracking/sync');
            setData(trackingData);
        } catch (err: any) {
            setError(err.message);
        }
    };
    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-dev-text-primary mb-4">Tracking Data</h2>
      <pre className="bg-dev-secondary-bg p-4 rounded-lg text-dev-text-secondary overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 