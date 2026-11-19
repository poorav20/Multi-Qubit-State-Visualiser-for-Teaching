import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import type { StateVector } from '../../engine/quantumMath';
import { QUIZ_QUESTIONS, type QuizQuestion } from '../../data/quizData';
import { CircleNotation } from '../visualizations/CircleNotation';
import { DiracNotation } from '../sandbox/DiracNotation';
import {
  HelpCircle,
  Clock,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sliders,
  Eye,
  FileText,
} from 'lucide-react';

interface QuizPanelProps {
  onLoadState?: (sv: StateVector, nQubits: number) => void;
}

interface QuestionAnswerState {
  selectedOptionId: string | null;
  confidence: number; // 0 to 4
  timeSpentSeconds: number;
  submitted: boolean;
  isCorrect: boolean;
}

const CONFIDENCE_LABELS = [
  '0: Complete Guess',
  '1: Low Confidence',
  '2: Moderate Confidence',
  '3: High Confidence',
  '4: Completely Sure',
];

export const QuizPanel: React.FC<QuizPanelProps> = ({ onLoadState }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'both' | 'diracOnly'>('both');
  const [answers, setAnswers] = useState<Record<number, QuestionAnswerState>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Timer per question
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  const currentQ: QuizQuestion = QUIZ_QUESTIONS[currentIndex];
  const currentAnswer = answers[currentQ.id] || {
    selectedOptionId: null,
    confidence: 2,
    timeSpentSeconds: 0,
    submitted: false,
    isCorrect: false,
  };

  // Timer effect
  useEffect(() => {
    if (quizFinished || currentAnswer.submitted) return;

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, quizFinished, currentAnswer.submitted]);

  // Reset timer on question switch
  useEffect(() => {
    if (!currentAnswer.submitted) {
      setElapsedSeconds(currentAnswer.timeSpentSeconds || 0);
    }
  }, [currentIndex]);

  const handleSelectOption = (optionId: string) => {
    if (currentAnswer.submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...currentAnswer,
        selectedOptionId: optionId,
      },
    }));
  };

  const handleConfidenceChange = (val: number) => {
    if (currentAnswer.submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...currentAnswer,
        confidence: val,
      },
    }));
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.selectedOptionId) return;
    const isCorrect = currentAnswer.selectedOptionId === currentQ.correctOptionId;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...currentAnswer,
        submitted: true,
        isCorrect,
        timeSpentSeconds: elapsedSeconds,
      },
    }));

    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNext = () => {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestartQuiz = () => {
    setAnswers({});
    setCurrentIndex(0);
    setQuizFinished(false);
    setElapsedSeconds(0);
  };

  // KaTeX render helper
  const renderLatex = (latex: string) => {
    try {
      return { __html: katex.renderToString(latex, { throwOnError: false }) };
    } catch {
      return { __html: latex };
    }
  };

  // ==========================================
  // Summary View
  // ==========================================
  if (quizFinished) {
    const totalQuestions = QUIZ_QUESTIONS.length;
    let correctCount = 0;
    let weightedScoreSum = 0;
    let totalConfidenceWeight = 0;
    let totalTime = 0;

    QUIZ_QUESTIONS.forEach((q) => {
      const ans = answers[q.id];
      if (ans) {
        totalTime += ans.timeSpentSeconds;
        const weight = ans.confidence + 1; // 1 to 5 scale
        totalConfidenceWeight += weight;
        if (ans.isCorrect) {
          correctCount++;
          weightedScoreSum += weight;
        }
      }
    });

    const confidenceScore =
      totalConfidenceWeight > 0 ? (weightedScoreSum / totalConfidenceWeight) * 100 : 0;
    const avgTime = (totalTime / totalQuestions).toFixed(1);

    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Results Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm text-center space-y-4">
          <div className="inline-flex p-3 bg-teal-50 rounded-2xl text-teal-600 mb-1">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Diagnostic Assessment Complete!
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Interactive diagnostic assessment complete! Below is your conceptual
            performance profile and diagnostic misconception report.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Raw Score</div>
              <div className="text-3xl font-extrabold text-teal-700 mt-1">
                {correctCount} / {totalQuestions}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((correctCount / totalQuestions) * 100).toFixed(0)}% Accuracy
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Confidence-Weighted
              </div>
              <div className="text-3xl font-extrabold text-indigo-700 mt-1">
                {confidenceScore.toFixed(0)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Weighted calibration metric</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Avg Response Time</div>
              <div className="text-3xl font-extrabold text-amber-700 mt-1">
                {avgTime}s
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Per research item</div>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={handleRestartQuiz}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Assessment
            </button>
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Item-by-Item Diagnostic Breakdown</h3>

          <div className="space-y-3">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const ans = answers[q.id];
              const isCorrect = ans?.isCorrect;
              const chosenOption = q.options.find((o) => o.id === ans?.selectedOptionId);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-sm transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                      <span>
                        Q{idx + 1}: {q.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 font-normal">
                        {q.category}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setQuizFinished(false);
                        setCurrentIndex(idx);
                      }}
                      className="text-xs text-teal-700 hover:underline font-medium"
                    >
                      Review →
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 pl-7 font-mono">{q.questionText}</p>

                  <div className="mt-3 pl-7 text-xs space-y-1">
                    <div>
                      <span className="font-semibold text-slate-700">Your Answer: </span>
                      <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                        ({chosenOption?.id || 'None'}) {chosenOption?.text}
                      </span>
                    </div>

                    {!isCorrect && ans?.selectedOptionId && (
                      <div className="p-2.5 bg-white/90 rounded-lg border border-rose-200 text-rose-800 mt-2">
                        <strong className="block text-[11px] uppercase tracking-wide text-rose-600">
                          Identified Misconception:
                        </strong>
                        <p className="mt-0.5">
                          {q.misconceptionMap[ans.selectedOptionId] || 'Conceptual error.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Active Question View
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Quiz Top Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
        {/* Progress Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Questions:</span>
          {QUIZ_QUESTIONS.map((q, idx) => {
            const ans = answers[q.id];
            const isCurrent = idx === currentIndex;
            let badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
            if (ans?.submitted) {
              badgeBg = ans.isCorrect
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                : 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
            } else if (isCurrent) {
              badgeBg = 'bg-teal-500 text-white border-teal-600 font-bold shadow-xs';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-medium border transition-all ${badgeBg}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* View Mode & Timer */}
        <div className="flex items-center gap-4">
          {/* Crossover A-B Study Toggle: Dirac Only vs Dirac + Visual */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'both'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Show both Dirac equation and Circle Notation diagram"
            >
              <Eye className="w-3.5 h-3.5" />
              Dirac + Visual
            </button>
            <button
              onClick={() => setViewMode('diracOnly')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'diracOnly'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Show only Dirac ket equation (tests pure symbolic reasoning)"
            >
              <FileText className="w-3.5 h-3.5" />
              Dirac Only
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{elapsedSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        {/* Header & Category */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {currentQ.category}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Question {currentIndex + 1}: {currentQ.title}
            </h2>
          </div>
          {onLoadState && (
            <button
              onClick={() => onLoadState(currentQ.stateVector, currentQ.nQubits)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
              title="Load this exact quantum state into the main Visualiser and Sandbox"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Sandbox
            </button>
          )}
        </div>

        {/* State Visualizations (Dual Representation Workspace) */}
        <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Target Quantum State Representation</span>
          </div>

          {/* Dirac Formatted Equation */}
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <DiracNotation stateVector={currentQ.stateVector} />
          </div>

          {/* Optional Visual Representation (CN / DCN) */}
          {viewMode === 'both' && (
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Circle Notation Representation:
              </div>
              <CircleNotation stateVector={currentQ.stateVector} showOverlays={true} />
            </div>
          )}
        </div>

        {/* Question Prompt */}
        <div className="space-y-2">
          <p className="text-slate-800 text-sm md:text-base font-medium leading-relaxed">
            {currentQ.questionText}
          </p>
          {currentQ.questionLatex && (
            <div
              className="text-base text-slate-900 font-serif pt-1"
              dangerouslySetInnerHTML={renderLatex(currentQ.questionLatex)}
            />
          )}
        </div>

        {/* Multiple Choice Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt) => {
            const isSelected = currentAnswer.selectedOptionId === opt.id;
            const isSubmitted = currentAnswer.submitted;
            const isCorrectOption = opt.id === currentQ.correctOptionId;

            let optionStyle =
              'border-slate-200 bg-white hover:border-slate-300 text-slate-800 hover:bg-slate-50/70';

            if (isSelected && !isSubmitted) {
              optionStyle = 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-200 text-teal-950 font-medium';
            } else if (isSubmitted) {
              if (isCorrectOption) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-2 ring-emerald-200';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-medium ring-2 ring-rose-200';
              } else {
                optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
              }
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all flex items-start gap-3 ${optionStyle}`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  {opt.id}
                </div>
                <div className="flex-1 leading-relaxed">
                  <span>{opt.text}</span>
                  {opt.latex && (
                    <div
                      className="mt-1 font-serif text-slate-900"
                      dangerouslySetInnerHTML={renderLatex(opt.latex)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confidence Slider (0-4 confidence scale) */}
        {!currentAnswer.submitted && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                Confidence Level in Your Choice:
              </span>
              <span className="font-bold text-teal-800">
                {CONFIDENCE_LABELS[currentAnswer.confidence]}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={currentAnswer.confidence}
              onChange={(e) => handleConfidenceChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 (Guess)</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4 (Certain)</span>
            </div>
          </div>
        )}

        {/* Submit & Next Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {!currentAnswer.submitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.selectedOptionId}
              className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                !currentAnswer.selectedOptionId
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              Confirm &amp; Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              {currentIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Results'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Immediate Empathetic Diagnostic Feedback */}
        {currentAnswer.submitted && (
          <div
            className={`p-4 md:p-5 rounded-xl border text-sm space-y-3 transition-all ${
              currentAnswer.isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base">
              {currentAnswer.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Not Quite — Let's Diagnose Why</span>
                </>
              )}
            </div>

            <p className="leading-relaxed">
              {currentAnswer.selectedOptionId &&
                currentQ.feedbackByOption[currentAnswer.selectedOptionId]}
            </p>

            {/* Misconception Diagnostic explanation if wrong */}
            {!currentAnswer.isCorrect && currentAnswer.selectedOptionId && (
              <div className="bg-white/80 p-3 rounded-lg border border-rose-200 text-xs text-rose-900">
                <span className="font-bold text-rose-700 block uppercase tracking-wide text-[10px] mb-1">
                  Targeted Research Misconception:
                </span>
                {currentQ.misconceptionMap[currentAnswer.selectedOptionId]}
              </div>
            )}

            {/* Visual Cue Resolution */}
            <div className="bg-white/90 p-3 rounded-lg border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-teal-800 block text-[11px] mb-0.5">
                  Visual Connection Cue (CN/DCN):
                </span>
                <span>{currentQ.visualCue}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
