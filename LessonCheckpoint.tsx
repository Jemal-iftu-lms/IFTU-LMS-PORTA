
import React, { useState } from 'react';
import { Question } from '../types';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface LessonCheckpointProps {
  checkpoint: { question: Partial<Question>, context: string };
  onCorrect: (points: number) => void;
}

const LessonCheckpoint: React.FC<LessonCheckpointProps> = ({ checkpoint, onCorrect }) => {
  const { question } = checkpoint;
  const [selected, setSelected] = useState<number | string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fitbValue, setFitbValue] = useState('');

  const isCorrect = question.type === 'multiple-choice' || question.type === 'true-false'
    ? selected === question.correctAnswer
    : fitbValue.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim();

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (isCorrect) {
      onCorrect(question.points || 5);
    }
  };

  return (
    <div className="my-12 p-8 md:p-12 bg-white border-8 border-black rounded-[3rem] shadow-[15px_15px_0px_0px_rgba(37,99,235,1)] animate-fadeIn relative overflow-hidden group">
      {/* Decorative Badge */}
      <div className="absolute top-0 right-0 bg-blue-600 text-white px-8 py-3 rounded-bl-[2rem] border-l-4 border-b-4 border-black font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Lesson Checkpoint
      </div>

      <div className="space-y-8 mt-4">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest italic">Verification Probe</p>
          <h4 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">{question.text}</h4>
        </div>

        {question.type === 'multiple-choice' || question.type === 'true-false' ? (
          <div className="grid gap-4">
            {question.options?.map((opt, idx) => (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => setSelected(idx)}
                className={`
                  w-full text-left p-6 rounded-2xl border-4 border-black font-black transition-all flex items-center gap-6
                  ${selected === idx 
                    ? 'bg-blue-600 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-gray-50 hover:bg-white hover:translate-x-2'
                  }
                  ${isSubmitted && idx === question.correctAnswer ? 'bg-green-500 !text-white !border-black' : ''}
                  ${isSubmitted && selected === idx && idx !== question.correctAnswer ? 'bg-rose-500 !text-white !border-black' : ''}
                  ${isSubmitted ? 'cursor-default' : ''}
                `}
              >
                <span className={`
                  w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0
                  ${selected === idx ? 'bg-white text-blue-600' : 'bg-black/5'}
                `}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
                {isSubmitted && idx === question.correctAnswer && <CheckCircle2 className="w-6 h-6" />}
                {isSubmitted && selected === idx && idx !== question.correctAnswer && <AlertCircle className="w-6 h-6" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text"
              disabled={isSubmitted}
              placeholder="Input your observation..."
              className={`
                w-full p-8 border-8 border-black rounded-[2rem] font-black text-2xl outline-none transition-all
                ${isSubmitted 
                  ? isCorrect ? 'bg-green-50 border-green-600 text-green-700' : 'bg-rose-50 border-rose-600 text-rose-700'
                  : 'bg-gray-50 focus:bg-white focus:shadow-[10px_10px_0px_0px_rgba(37,99,235,1)]'
                }
              `}
              value={fitbValue}
              onChange={e => setFitbValue(e.target.value)}
            />
          </div>
        )}

        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            className="w-full py-6 bg-black text-white rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] hover:translate-y-1 active:shadow-none transition-all"
          >
            Submit Intel →
          </button>
        ) : (
          <div className={`p-8 rounded-2xl border-4 border-black flex items-center gap-6 animate-scaleIn ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-black text-3xl font-black ${isCorrect ? 'bg-green-500' : 'bg-rose-500'}`}>
              {isCorrect ? '✓' : '✕'}
            </div>
            <div>
              <p className="text-xl font-black uppercase italic">{isCorrect ? 'Identification Confirmed' : 'Registry Conflict'}</p>
              <p className="text-sm font-bold opacity-80">
                {isCorrect 
                  ? `Success: ${question.points} points indexed to your profile.` 
                  : `Correction: Technical expected value was "${question.type === 'multiple-choice' ? question.options?.[question.correctAnswer as number] : question.correctAnswer}".`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonCheckpoint;
