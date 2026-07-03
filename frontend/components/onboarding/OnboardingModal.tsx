'use client'

import { useState } from 'react'

const STEPS = [
  {
    emoji: '📚',
    title: 'Create a course',
    body: 'Start by creating a course for each subject you\'re studying — like Calculus, Biology, or Economics. Each course keeps its own materials and chat separate.',
  },
  {
    emoji: '📄',
    title: 'Upload your materials',
    body: 'Add your lecture notes, textbooks, or past questions as PDFs. ScholarAI reads them so it can answer questions using your actual course content.',
  },
  {
    emoji: '💬',
    title: 'Ask anything',
    body: 'Chat with ScholarAI about your materials, generate quizzes to test yourself, and get a personalized study plan. Every answer is grounded in your uploads.',
  },
]

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md p-6 md:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-muted hover:text-theme-text text-sm"
        >
          Skip
        </button>

        {step === 0 && (
          <p className="text-[#0EA5E9] text-sm font-medium mb-4">Welcome to ScholarAI 🎓</p>
        )}

        <div className="text-center py-4">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-xl font-bold text-theme-text mb-3">{current.title}</h2>
          <p className="text-theme-muted text-sm leading-relaxed">{current.body}</p>
        </div>

        <div className="flex justify-center gap-2 my-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-[#0EA5E9]' : 'w-1.5 bg-theme-border'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-theme-muted hover:text-theme-text text-sm disabled:opacity-0 transition-opacity"
          >
            Back
          </button>
          <button
            onClick={() => (isLast ? onClose() : setStep(s => s + 1))}
            className="bg-[#0EA5E9] hover:bg-[#38BDF8] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
