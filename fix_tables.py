import re
import os

files = [
    "app/admin/(authenticated)/comments/CommentsQueueClient.tsx",
    "app/admin/(authenticated)/subscribers/SubscribersClient.tsx",
    "app/admin/(authenticated)/users/UserDirectoryTable.tsx",
    "app/admin/(authenticated)/taxonomy/TaxonomyManager.tsx",
    "app/admin/(authenticated)/audit-logs/AuditLogsClient.tsx",
    "components/console/ArticleIndex.tsx"
]

def add_whitespace_nowrap(content):
    # For th
    content = re.sub(r'<th\s+className="([^"]+)"', 
                     lambda m: f'<th className="{m.group(1)} whitespace-nowrap min-w-[120px]"' if 'whitespace-nowrap' not in m.group(1) else m.group(0), 
                     content)
    # For td
    content = re.sub(r'<td\s+className="([^"]+)"', 
                     lambda m: f'<td className="{m.group(1)} whitespace-nowrap"' if 'whitespace-nowrap' not in m.group(1) else m.group(0), 
                     content)
    # If there are th or td without className
    content = re.sub(r'<th(\s*|>)', r'<th className="whitespace-nowrap min-w-[120px]"\1', content)
    # Clean up double classNames if we messed up
    content = re.sub(r'<th className="whitespace-nowrap min-w-\[120px\]" className="', r'<th className="whitespace-nowrap min-w-[120px] ', content)
    
    content = re.sub(r'<td(\s*|>)', r'<td className="whitespace-nowrap"\1', content)
    content = re.sub(r'<td className="whitespace-nowrap" className="', r'<td className="whitespace-nowrap ', content)
    return content

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Wrap tables that aren't wrapped
    # Find <table ...> up to </table>
    # If the parent is not overflow-x-auto, wrap it.
    
    # Simple heuristic: replace <table with <div className="overflow-x-auto w-full"><table
    # and </table> with </table></div>
    # But ONLY if not already preceded by overflow-x-auto
    
    # This is tricky with regex. Let's just do a manual check.
    if 'overflow-x-auto' not in content and '<table' in content:
        content = re.sub(r'(<table[^>]*>.*?</table>)', r'<div className="overflow-x-auto w-full">\n\1\n</div>', content, flags=re.DOTALL)
    
    # 2. Add whitespace-nowrap
    content = add_whitespace_nowrap(content)
    
    if content != original:
        with open(file, 'w') as f:
            f.write(content)
        print(f"Updated {file}")
