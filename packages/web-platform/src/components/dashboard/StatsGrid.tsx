import { CodingSession } from '../../types';

interface StatsGridProps {
  sessions: CodingSession[];
}

export function StatsGrid({ sessions }: StatsGridProps) {
  const totalSessions = sessions.length;
  const totalCodingTime = sessions.reduce((acc, session) => acc + (session.durationSeconds || 0), 0);
  const averageProductivity =
    totalSessions > 0
      ? Math.round(
          sessions.reduce((acc, session) => acc + (session.productivityScore || 0), 0) /
            totalSessions
        )
      : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-dev-secondary-bg p-4 rounded-lg">
        <h3 className="text-dev-text-secondary text-sm">Total Coding Time</h3>
        <p className="text-2xl font-bold text-dev-text-primary">{formatTime(totalCodingTime)}</p>
      </div>
      <div className="bg-dev-secondary-bg p-4 rounded-lg">
        <h3 className="text-dev-text-secondary text-sm">Total Sessions</h3>
        <p className="text-2xl font-bold text-dev-text-primary">{totalSessions}</p>
      </div>
      <div className="bg-dev-secondary-bg p-4 rounded-lg">
        <h3 className="text-dev-text-secondary text-sm">Average Productivity</h3>
        <p className="text-2xl font-bold text-dev-text-primary">{averageProductivity}%</p>
      </div>
    </div>
  );
} 