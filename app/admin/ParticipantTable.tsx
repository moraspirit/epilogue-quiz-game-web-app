'use client';

import { useState } from 'react';

type Participant = {
  id: number;
  indexNumber: string;
  name: string;
  status: string;
  accumulatedScore: number;
  totalCorrect: number;
  joinedAt: string;
};

export default function ParticipantTable({ participants }: { participants: Participant[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = participants.filter(
    (p) =>
      p.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-8 bg-[#181D2F]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-white">Participant Progress Ledger</h2>
        <input
          type="text"
          placeholder="Search Index or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2.5 bg-[#0A0E17] border border-white/10 text-slate-200 placeholder-slate-600 rounded-xl w-full sm:max-w-xs text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 transition-all"
        />
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 backdrop-blur-xl bg-[#181D2F]/90 z-10 border-b border-white/5">
            <tr>
              <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Index Number</th>
              <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Name</th>
              <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Current Status</th>
              <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Total Score</th>
              <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Correct Ans</th>
              <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Joined At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No participants found matching "{searchTerm}".
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <span className="font-mono text-xs text-[#4A72FF] bg-[#4A72FF]/10 border border-[#4A72FF]/20 rounded-md px-2.5 py-1">
                      {user.indexNumber}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-200">{user.name}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      user.status.includes('Completed') 
                        ? 'bg-[#8C52FF]/10 text-[#8C52FF] border-[#8C52FF]/30 shadow-[0_0_10px_rgba(140,82,255,0.2)]'
                        : 'bg-white/5 text-slate-300 border-white/10'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">{user.accumulatedScore}</td>
                  <td className="p-4 text-slate-400">{user.totalCorrect} answers</td>
                  <td className="p-4 text-slate-500 text-xs">{user.joinedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
