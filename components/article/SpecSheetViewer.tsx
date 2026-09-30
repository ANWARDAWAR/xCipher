import React from 'react';
import { List } from 'lucide-react';

interface SpecItem {
  category?: string;
  key: string;
  value: string;
}

interface Props {
  items: SpecItem[];
}

/**
 * Groups specs by category for GSMArena-style rendering.
 * If no category is present (legacy 2-column data), falls back to a flat list.
 */
function groupByCategory(items: SpecItem[]): { category: string; specs: { key: string; value: string }[] }[] {
  const groups: { category: string; specs: { key: string; value: string }[] }[] = [];
  const map = new Map<string, { key: string; value: string }[]>();

  for (const item of items) {
    const cat = item.category?.trim() || '';
    if (!map.has(cat)) {
      map.set(cat, []);
      groups.push({ category: cat, specs: map.get(cat)! });
    }
    map.get(cat)!.push({ key: item.key, value: item.value });
  }

  return groups;
}

export default function SpecSheetViewer({ items }: Props) {
  if (!items || items.length === 0) return null;

  const groups = groupByCategory(items);
  const hasCategories = groups.some(g => g.category.length > 0);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm my-6 overflow-hidden flex flex-col p-0 m-0">
      {/* Admin-style Slim Header Strip */}
      <div className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 flex items-center gap-2">
        <List className="w-4 h-4 text-red-600 dark:text-red-500" />
        <span className="text-sm font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
          Specifications
        </span>
      </div>

      {/* MOBILE ONLY */}
      <div className="flex flex-col md:hidden w-full m-0 p-0">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col">
            {hasCategories && group.category && (
              <div className="bg-neutral-100 dark:bg-neutral-800/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500 border-b border-neutral-200 dark:border-neutral-800">
                {group.category}
              </div>
            )}
            {group.specs.map((spec, si) => {
              const isLastRow = gi === groups.length - 1 && si === group.specs.length - 1;
              return (
                <div
                  key={`${gi}-${si}`}
                  className={`grid grid-cols-[35%_65%] ${isLastRow ? '' : 'border-b border-neutral-200 dark:border-neutral-800'}`}
                >
                  <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/40 border-r border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 break-words">
                    {spec.key}
                  </div>
                  <div className="px-4 py-2.5 bg-white dark:bg-neutral-900 text-xs font-normal text-neutral-700 dark:text-neutral-300 break-words">
                    {spec.value}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* DESKTOP ONLY */}
      <div className="hidden md:block w-full overflow-x-auto m-0 p-0">
        <table className="w-full text-left border-collapse m-0 table-fixed !w-full !min-w-full !m-0 !table-fixed">
          <tbody>
            {groups.map((group, gi) => (
              <React.Fragment key={gi}>
                {group.specs.map((spec, si) => {
                  const isLastRow = gi === groups.length - 1 && si === group.specs.length - 1;
                  return (
                    <tr
                      key={`${gi}-${si}`}
                      className={isLastRow ? 'border-b-0' : 'border-b border-neutral-200 dark:border-neutral-800'}
                    >
                      {hasCategories && si === 0 && (
                        <td
                          rowSpan={group.specs.length}
                          className={`w-[20%] align-top px-4 py-3 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-red-600 dark:text-red-500 font-bold uppercase tracking-wider text-xs sm:text-sm !text-red-600 dark:!text-red-500 !font-bold border-l-0 ${gi === groups.length - 1 ? 'border-b-0' : ''}`}
                        >
                          <span className="text-red-600 dark:text-red-500 font-bold uppercase tracking-wider text-xs sm:text-sm">
                            {group.category || '—'}
                          </span>
                        </td>
                      )}
                      <td
                        className={`${hasCategories ? 'w-[25%]' : 'w-[30%] border-l-0'} align-top px-4 py-3 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-sm font-bold text-neutral-800 dark:text-neutral-200`}
                      >
                        {spec.key}
                      </td>
                      <td
                        className={`${hasCategories ? 'w-[55%]' : 'w-[70%]'} align-top px-4 py-3 bg-white dark:bg-neutral-900 text-sm font-normal text-neutral-700 dark:text-neutral-300 border-r-0`}
                      >
                        {spec.value}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
