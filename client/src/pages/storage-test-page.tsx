import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export default function StorageTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStorageInfo() {
      try {
        const response = await fetch('/api/admin/storage-info');
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        console.log('Storage test API response:', result);
        setData(result);
      } catch (err: any) {
        console.error('Storage test error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStorageInfo();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Storage Test Page</h1>
      
      {loading && <p>Loading storage info...</p>}
      
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {data && (
        <div>
          <h2 className="text-xl font-bold mb-4">Storage Info</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}