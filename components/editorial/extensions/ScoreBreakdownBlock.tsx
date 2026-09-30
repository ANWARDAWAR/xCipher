import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X, BarChart2 } from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scoreBreakdown: {
      insertScoreBreakdown: () => ReturnType;
    };
  }
}

const DEFAULT_SCORES = [
  { label: 'Design', score: 8 },
  { label: 'Performance', score: 9 },
  { label: 'Battery', score: 7 },
  { label: 'Value', score: 8 }
];

export const ScoreBreakdownBlock = Node.create({
  name: 'scoreBreakdownBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      categories: {
        default: JSON.stringify(DEFAULT_SCORES),
        parseHTML: (element) => element.getAttribute('data-categories'),
        renderHTML: (attributes) => ({
          'data-categories': attributes.categories,
        }),
      },
      overallScore: {
        default: 8,
        parseHTML: (element) => Number(element.getAttribute('data-overall-score')),
        renderHTML: (attributes) => ({
          'data-overall-score': attributes.overallScore,
        }),
      }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="score-breakdown-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'score-breakdown-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScoreBreakdownNodeView);
  },

  addCommands() {
    return {
      insertScoreBreakdown: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});

function ScoreBreakdownNodeView({ node, updateAttributes }: any) {
  const categories = JSON.parse(node.attrs.categories || '[]');
  const overallScore = node.attrs.overallScore || 0;
  
  const [newCat, setNewCat] = useState('');
  const [newScore, setNewScore] = useState(5);

  const calculateTotal = (currentScores: any[]) => {
    if (currentScores.length === 0) return 0;
    const sum = currentScores.reduce((acc, curr) => acc + Number(curr.score), 0);
    // Round to 1 decimal place
    return Math.round((sum / currentScores.length) * 10) / 10;
  };

  const addCategory = () => {
    if (newCat.trim()) {
      const next = [...categories, { label: newCat.trim(), score: Number(newScore) }];
      updateAttributes({ 
        categories: JSON.stringify(next),
        overallScore: calculateTotal(next)
      });
      setNewCat('');
      setNewScore(5);
    }
  };

  const removeCategory = (index: number) => {
    const next = [...categories];
    next.splice(index, 1);
    updateAttributes({ 
      categories: JSON.stringify(next),
      overallScore: calculateTotal(next)
    });
  };

  const updateScore = (index: number, val: number) => {
    const next = [...categories];
    next[index].score = val;
    updateAttributes({ 
      categories: JSON.stringify(next),
      overallScore: calculateTotal(next)
    });
  };

  const updateCategoryName = (index: number, val: string) => {
    const next = [...categories];
    next[index].label = val;
    updateAttributes({ categories: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="my-8 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden font-sans">
      <div className="bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[var(--accent)]" />
          Score Breakdown
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted)] text-xs">Overall Score</span>
          <span className="bg-[var(--accent)] text-white px-2.5 py-0.5 rounded-full text-sm font-bold">
            {overallScore.toFixed(1)}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-4">
        {categories.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-4 bg-[var(--surface)] p-3 rounded-md border border-[var(--line)]">
            <div className="w-1/3">
              <input 
                type="text" 
                value={item.label} 
                onChange={(e) => updateCategoryName(i, e.target.value)}
                className="w-full bg-transparent text-[var(--ink)] font-medium focus:outline-none"
              />
            </div>
            <div className="flex-1 flex items-center gap-3">
              <input 
                type="range" 
                min="0" max="10" step="0.5"
                value={item.score}
                onChange={(e) => updateScore(i, parseFloat(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <span className="w-8 text-right text-sm font-bold text-[var(--ink)]">{item.score}</span>
            </div>
            <button type="button" onClick={() => removeCategory(i)} className="text-[var(--muted)] hover:text-red-500 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <div className="flex items-center gap-4 mt-2 border-t border-[var(--line)] pt-4">
          <div className="w-1/3">
            <input 
              type="text" 
              value={newCat} 
              onChange={e => setNewCat(e.target.value)}
              placeholder="New Category..."
              className="w-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex-1 flex items-center gap-3">
            <input 
              type="range" 
              min="0" max="10" step="0.5"
              value={newScore}
              onChange={(e) => setNewScore(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <span className="w-8 text-right text-sm font-bold text-[var(--muted)]">{newScore}</span>
          </div>
          <button type="button" onClick={addCategory} className="bg-[var(--surface-3)] hover:bg-[var(--line)] text-[var(--ink)] px-2.5 py-1.5 rounded-md border border-[var(--line)]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
