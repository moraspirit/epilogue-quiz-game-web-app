'use client';

import { useState } from 'react';
import { loginAdmin } from './actions';

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await loginAdmin(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d1729] text-white">
      <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-[#172136]/92 p-8 shadow-2xl shadow-slate-950/35">
        <h1 className="text-2xl font-black leading-tight text-center mb-2">Master Control</h1>
        <p className="text-center text-sm font-medium text-slate-400 mb-6">Enter administrative credentials</p>
        
        {error && (
          <div className="mb-4 p-3 text-sm font-medium border border-red-500/50 bg-red-500/10 text-red-400 rounded-lg text-center">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Username</label>
            <input
              type="text"
              name="username"
              required
              className="w-full flex h-12 items-center rounded-xl border border-slate-600/55 bg-[#172238] px-4 text-white focus:border-blue-400 focus:outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full flex h-12 items-center rounded-xl border border-slate-600/55 bg-[#172238] px-4 text-white focus:border-blue-400 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-black text-white shadow-xl transition hover:scale-[1.02] cursor-pointer"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}