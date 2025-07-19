import { useState, useEffect } from 'react';
import { createApiClient } from '../lib/supabase';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ActivityChart } from '../components/dashboard/ActivityChart';

const apiClient = createApiClient();

export function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const trackingData = await apiClient.get('/api/tracking/sync');
        if (Array.isArray(trackingData)) {
          setSessions(trackingData);
        } else {
          // Handle cases where the API might not return an array (e.g., error object)
          console.error("Fetched data is not an array:", trackingData);
          setSessions([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-dev-text-primary mb-6">
        Dashboard
      </h1>
      {loading && <p className="text-dev-text-secondary">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div className="space-y-6">
          <StatsGrid sessions={sessions} />
          <ActivityChart sessions={sessions} />
          {/* I will add more components here to display the data */}
        </div>
      )}
    </div>
  );
} 