import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CodingSession } from '../../types';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface ActivityChartProps {
  sessions: CodingSession[];
}

export function ActivityChart({ sessions }: ActivityChartProps) {
  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return last7Days.map((day) => {
      const sessionsOnDay = sessions.filter(
        (session) => format(new Date(session.sessionStart), 'yyyy-MM-dd') === day
      );
      const totalDuration = sessionsOnDay.reduce(
        (acc, session) => acc + (session.durationSeconds || 0),
        0
      );
      return {
        name: format(new Date(day), 'EEE'),
        duration: Math.round(totalDuration / 60), // in minutes
      };
    });
  }, [sessions]);

  return (
    <div className="bg-dev-secondary-bg p-4 rounded-lg h-80">
      <h3 className="text-dev-text-secondary text-sm mb-4">Coding Activity (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" />
          <Tooltip
            contentStyle={{ backgroundColor: '#111111', border: '1px solid #1a1a1a' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Bar dataKey="duration" fill="#00d4ff" name="Minutes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 