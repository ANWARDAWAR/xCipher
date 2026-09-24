import os
import re

files = [
    "app/admin/(authenticated)/audit-logs/AuditLogsClient.tsx",
    "app/admin/(authenticated)/comments/CommentsQueueClient.tsx",
    "app/admin/(authenticated)/subscribers/SubscribersClient.tsx",
    "app/admin/(authenticated)/taxonomy/TaxonomyManager.tsx",
    "app/admin/(authenticated)/users/UserDirectoryTable.tsx",
    "components/console/ArticleIndex.tsx"
]

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()

    # Find <td className="whitespace-nowrap" ... className="..."
    # and merge them
    content = re.sub(r'className="whitespace-nowrap"\s+([^>]*?)\s+className="([^"]+)"', r'\1 className="whitespace-nowrap \2"', content)
    
    with open(file, 'w') as f:
        f.write(content)
    print(f"Fixed {file}")
