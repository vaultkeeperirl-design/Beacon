import { useState } from 'react';
import { X, Plus, Trash2, PieChart } from 'lucide-react';

export default function PollCreator({ isOpen, onClose, onStartPoll }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) return;

    onStartPoll(question, validOptions);
    onClose();
    // Reset form
    setQuestion('');
    setOptions(['', '']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-beacon-500" />
          Create Poll
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:border-beacon-500 outline-none transition-colors"
              placeholder="Ask your community something..."
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-neutral-300">Options</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:border-beacon-500 outline-none transition-colors"
                  placeholder={`Option ${idx + 1}`}
                  maxLength={50}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 4 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-sm font-medium text-beacon-400 hover:text-beacon-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          )}

          <div className="pt-6 border-t border-neutral-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
              className="px-6 py-2 bg-beacon-600 hover:bg-beacon-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-beacon-600/20"
            >
              Start Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
