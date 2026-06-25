import { prisma } from '@/lib/prisma';
import { addQuestion, deleteQuestion } from './actions';
import ParticipantTable from './ParticipantTable';
import QuizLevelOrderPanel from './QuizLevelOrderPanel';
import { createPageMetadata } from '@/lib/siteMetadata';
import { computeQuizStatus } from '@/lib/quizProgress';
import type { Metadata } from 'next';

export const metadata: Metadata = createPageMetadata('Admin Dashboard');

export const dynamic = 'force-dynamic';

async function getAdminData() {
  const [users, totalQuestions, totalProgress, quizLevels, allQuestions] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: 'USER' },
        include: {
          progress: {
            where: { isCorrect: true },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quizQuestion.count({
        where: { quizLevel: { isActive: true } },
      }),
      prisma.userProgress.count({ where: { isCorrect: true } }),
      prisma.quizLevel.findMany({
        orderBy: { levelOrder: 'asc' },
      }),
      prisma.quizQuestion.findMany({
        include: { quizLevel: true },
        orderBy: [{ quizLevelId: 'asc' }, { questionOrder: 'asc' }],
      }),
    ]);

  const totalWinners =
    totalQuestions > 0
      ? users.filter((user) => user.progress.length >= totalQuestions).length
      : 0;

  return {
    users,
    totalWinners,
    totalQuestions,
    totalAttempts: totalProgress,
    quizLevels,
    allQuestions,
  };
}

export default async function AdminDashboard() {
  const {
    users,
    totalWinners,
    totalQuestions,
    totalAttempts,
    quizLevels,
    allQuestions,
  } = await getAdminData();

  const tableData = users.map((user) => {
    const totalCorrect = user.progress.length;
    const status = computeQuizStatus(totalCorrect, totalQuestions);

    return {
      id: user.id,
      indexNumber: user.indexNumber ?? '',
      name: user.name,
      status: status === 'Completed' ? 'Completed 🏆' : status,
      accumulatedScore: totalCorrect,
      totalCorrect,
      joinedAt: new Date(user.createdAt).toLocaleDateString(),
    };
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0E17] text-white p-8 z-0 font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4A72FF] opacity-10 blur-[150px] -z-10 rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-[#8C52FF] opacity-15 blur-[150px] -z-10 rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            Epilogue Quiz Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time participant performance and manage game content.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Registrations', value: users.length },
            { label: 'Correct Answers', value: totalAttempts },
            { label: 'Total Questions', value: allQuestions.length },
            { label: 'Finished Players 🏆', value: totalWinners },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#181D2F]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</p>
              <p className="text-3xl font-bold tracking-tight mt-2 text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <QuizLevelOrderPanel
          levels={quizLevels.map((level) => ({
            id: level.id,
            title: level.title,
            levelOrder: level.levelOrder,
          }))}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#181D2F]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg h-fit">
            <h2 className="text-lg font-semibold mb-5 text-white">Add Quiz Question</h2>
            <form action={addQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Question Group</label>
                <select name="quizLevelId" required className="w-full bg-[#0A0E17] border border-white/10 text-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 transition-all">
                  <option value="">Select a group...</option>
                  {quizLevels.map((level) => (
                    <option key={level.id} value={level.id}>{level.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Answer Key</label>
                  <input type="text" name="answerKey" required placeholder="e.g., 42" className="w-full bg-[#0A0E17] border border-white/10 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Order</label>
                  <input type="number" name="questionOrder" required defaultValue={1} className="w-full bg-[#0A0E17] border border-white/10 text-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Question Text</label>
                <textarea name="questionText" required rows={3} placeholder="Type the question prompt here..." className="w-full bg-[#0A0E17] border border-white/10 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A72FF]/50 resize-none transition-all" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#4A72FF] to-[#8C52FF] text-white font-medium text-sm py-3 px-4 rounded-xl hover:shadow-[0_0_20px_rgba(74,114,255,0.4)] transition-all cursor-pointer border-0 mt-2">
                Save Question
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-[#181D2F]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Active Question Bank</h2>
            </div>

            <div className="overflow-x-auto max-h-[440px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 backdrop-blur-xl bg-[#181D2F]/90 z-10 border-b border-white/5">
                  <tr>
                    <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Group</th>
                    <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Order</th>
                    <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Question</th>
                    <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs">Answer</th>
                    <th className="p-4 font-medium text-slate-400 uppercase tracking-wider text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No questions found. Add some to get started!</td>
                    </tr>
                  ) : (
                    allQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 font-semibold text-slate-200">{q.quizLevel.title}</td>
                        <td className="p-4 text-slate-400">#{q.questionOrder}</td>
                        <td className="p-4 max-w-[200px] truncate text-slate-300" title={q.questionText}>{q.questionText}</td>
                        <td className="p-4 font-mono text-xs text-[#8C52FF] bg-[#8C52FF]/10 rounded px-2 py-1 w-fit inline-block mt-3 ml-4">{q.answerKey}</td>
                        <td className="p-4 text-right">
                          <form action={deleteQuestion}>
                            <input type="hidden" name="questionId" value={q.id} />
                            <button type="submit" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs font-medium border border-red-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100">
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

        <div className="bg-[#181D2F]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg">
           <ParticipantTable participants={tableData} />
        </div>
      </div>
    </div>
  );
}
