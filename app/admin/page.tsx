import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force dynamic rendering so statistics update in real-time
export const dynamic = 'force-dynamic';

async function getAdminData() {
  const [users, winners, levels, totalProgress] = await Promise.all([
    prisma.user.findMany({
      include: {
        progress: {
          include: {
            question: true,
          }
        },
        completedLevels: {
          include: {
            quizLevel: true,
          }
        },
        winners: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.winner.count(),
    prisma.quizLevel.count(),
    prisma.userProgress.count(),
  ]);

  return { users, totalWinners: winners, totalLevels: levels, totalAttempts: totalProgress };
}

export default async function AdminDashboard() {
  const { users, totalWinners, totalLevels, totalAttempts } = await getAdminData();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Admin Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitor real-time participant performance, score aggregates, and completion status.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Registrations', value: users.length },
            { label: 'Total Question Attempts', value: totalAttempts },
            { label: 'Configured Levels', value: totalLevels },
            { label: 'Game Winners 🏆', value: totalWinners },
          ].map((stat, idx) => (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{stat.label}</p>
              <p className="text-2xl font-semibold tracking-tight text-neutral-200 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Participants Table Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-800">
            <h2 className="text-lg font-medium text-neutral-200">Participant Progress Ledger</h2>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-neutral-950 text-neutral-400 sticky top-0 border-b border-neutral-800 z-10">
                <tr>
                  <th className="p-4 font-medium">Index Number</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Current Status</th>
                  <th className="p-4 font-medium">Max Level Reached</th>
                  <th className="p-4 font-medium">Total Score</th>
                  <th className="p-4 font-medium">Correct Ans</th>
                  <th className="p-4 font-medium">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      No registered participants found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    // Extracting contextual state calculations from relations
                    const latestProgress = user.progress[user.progress.length - 1];
                    const isWinner = user.winners.length > 0;
                    
                    const status = isWinner ? 'Completed 🏆' : (latestProgress?.status || 'Idle');
                    const maxLevel = latestProgress?.currentLevel || 1;
                    const accumulatedScore = latestProgress?.totalScore || 0;
                    const totalCorrect = user.progress.filter(p => p.isCorrect).length;

                    return (
                      <tr key={user.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="p-4 font-mono font-medium text-neutral-300">{user.indexNumber}</td>
                        <td className="p-4 font-medium text-neutral-200">{user.name}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isWinner 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : status === 'Active' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-300">Level {maxLevel}</td>
                        <td className="p-4 font-semibold text-neutral-200">{accumulatedScore}</td>
                        <td className="p-4 text-neutral-400">{totalCorrect} answers</td>
                        <td className="p-4 text-neutral-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}