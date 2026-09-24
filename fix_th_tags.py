import os
import re

files = [
    "app/admin/(authenticated)/comments/CommentsQueueClient.tsx",
    "app/admin/(authenticated)/subscribers/SubscribersClient.tsx",
    "app/admin/(authenticated)/users/UserDirectoryTable.tsx",
    "app/admin/(authenticated)/taxonomy/TaxonomyManager.tsx",
    "app/admin/(authenticated)/audit-logs/AuditLogsClient.tsx",
    "components/console/ArticleIndex.tsx"
]

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()

    # Fix <thead
    content = content.replace('<th className="whitespace-nowrap min-w-[120px]"ead>', '<thead>')
    
    # Fix double whitespace-nowrap min-w-[120px] inside classNames
    content = re.sub(r'className="whitespace-nowrap min-w-\[120px\]([^"]*)whitespace-nowrap min-w-\[120px\]"', r'className="whitespace-nowrap min-w-[120px]\1"', content)
    content = re.sub(r'className="whitespace-nowrap([^"]*)whitespace-nowrap"', r'className="whitespace-nowrap\1"', content)
    
    with open(file, 'w') as f:
        f.write(content)
    print(f"Fixed {file}")
