import { prisma } from '@/lib/prisma';
import { addQuestion, deleteQuestion } from './actions';

export const dynamic = 'force-dynamic';

async function getAdminData() {
  const [users, winners, levels, totalProgress, quizLevels, allQuestions] = await Promise.all([
    // Restored the full user includes for the participant table
    prisma.user.findMany({
      include: {
        progress: { include: { question: true } },
        completedLevels: { include: { quizLevel: true } },
        winners: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.winner.count(),
    prisma.quizLevel.count(),
    prisma.userProgress.count(),
    prisma.quizLevel.findMany({
      orderBy: { levelOrder: 'asc' },
    }),
    prisma.quizQuestion.findMany({
      include: { quizLevel: true },
      orderBy: [{ quizLevelId: 'asc' }, { questionOrder: 'asc' }],
    }),
  ]);

  return { users, totalWinners: winners, totalLevels: levels, totalAttempts: totalProgress, quizLevels, allQuestions };
}

export default async function AdminDashboard() {
  const { users, totalWinners, totalLevels, totalAttempts, quizLevels, allQuestions } = await getAdminData();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Admin Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitor real-time participant performance and manage game content.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Content Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Add Question Form */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm h-fit">
            <h2 className="text-lg font-medium text-neutral-200 mb-4">Add Quiz Question</h2>
            <form action={addQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Target Level</label>
                <select name="quizLevelId" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700">
                  <option value="">Select a Level...</option>
                  {quizLevels.map((level) => (
                    <option key={level.id} value={level.id}>Level {level.levelOrder}: {level.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Answer Key</label>
                  <input type="text" name="answerKey" required placeholder="e.g., 42" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Order</label>
                  <input type="number" name="questionOrder" required defaultValue={1} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">Question Text</label>
                <textarea name="questionText" required rows={3} placeholder="Type the question prompt here..." className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700 resize-none" />
              </div>
              <button type="submit" className="w-full bg-neutral-100 text-neutral-950 font-medium text-sm py-2 px-4 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer">
                Save Question
              </button>
            </form>
          </div>

          {/* Right: Existing Question Bank Ledger */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-neutral-800 bg-neutral-900">
              <h2 className="text-lg font-medium text-neutral-200">Active Question Bank</h2>
            </div>
            
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-neutral-950 text-neutral-400 sticky top-0 border-b border-neutral-800 z-10">
                  <tr>
                    <th className="p-4 font-medium">Lvl</th>
                    <th className="p-4 font-medium">Order</th>
                    <th className="p-4 font-medium">Question</th>
                    <th className="p-4 font-medium">Answer</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {allQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-500">No questions found. Add some to get started!</td>
                    </tr>
                  ) : (
                    allQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="p-4 font-semibold text-neutral-300">{q.quizLevel.levelOrder}</td>
                        <td className="p-4 text-neutral-400">#{q.questionOrder}</td>
                        <td className="p-4 text-neutral-200 max-w-[200px] truncate" title={q.questionText}>{q.questionText}</td>
                        <td className="p-4 font-mono text-xs text-amber-400">{q.answerKey}</td>
                        <td className="p-4 text-right">
                          <form action={deleteQuestion}>
                            <input type="hidden" name="questionId" value={q.id} />
                            <button type="submit" className="text-red-400 hover:text-red-300 text-xs font-medium bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded transition-colors cursor-pointer">
                              Drop
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RESTORED: Participants Table Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm mt-8">
          <div className="p-5 border-b border-neutral-800">
            <h2 className="text-lg font-medium text-neutral-200">Participant Progress Ledger</h2>
          </div>
          
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
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