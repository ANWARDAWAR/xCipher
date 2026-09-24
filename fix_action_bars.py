import re
import os

# 1. Fix ArticleEditor.tsx
editor_file = "components/editorial/ArticleEditor.tsx"
if os.path.exists(editor_file):
    with open(editor_file, 'r') as f:
        content = f.read()
    
    # Hide Word count on mobile unconditionally
    content = content.replace("isBelowMin ? 'text-[var(--warn)]' : 'text-[var(--muted)] hidden md:flex'", "isBelowMin ? 'text-[var(--warn)] hidden sm:flex' : 'text-[var(--muted)] hidden md:flex'")
    
    # Save Draft button text
    content = content.replace('<span>{busy ? "Saving\\u2026" : "Save Draft"}</span>', '<span className="hidden sm:inline">{busy ? "Saving\\u2026" : "Save Draft"}</span>')
    content = content.replace('px-3.5 py-1.5 text-sm', 'px-2 sm:px-3.5 py-1.5 text-sm')
    
    # Publish button
    content = content.replace('min-w-[140px]', 'min-w-[90px] sm:min-w-[140px]')
    content = content.replace('<span>Publish</span>', '<span className="hidden sm:inline">Publish</span>')
    content = content.replace('<span>Submit</span>', '<span className="hidden sm:inline">Submit</span>')
    
    with open(editor_file, 'w') as f:
        f.write(content)
    print(f"Updated {editor_file}")

# 2. Fix flex-wrap on action bars above tables
client_files = [
    "app/admin/(authenticated)/subscribers/SubscribersClient.tsx",
    "app/admin/(authenticated)/users/UserDirectoryTable.tsx",
    "app/admin/(authenticated)/audit-logs/AuditLogsClient.tsx",
    "app/admin/(authenticated)/taxonomy/TaxonomyManager.tsx"
]

for file in client_files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()
        
        # Look for typical action bar classes
        # e.g. "flex items-center gap-3 w-full md:w-auto"
        # or "flex gap-2" next to a search bar
        
        # General replace of specific patterns if found
        content = content.replace('className="flex items-center gap-3 w-full md:w-auto"', 'className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto"')
        content = content.replace('className="flex items-center gap-2 w-full md:w-auto"', 'className="flex flex-wrap items-center gap-2 w-full md:w-auto"')
        content = content.replace('className="flex gap-2 w-full md:w-auto"', 'className="flex flex-wrap gap-2 w-full md:w-auto"')
        content = content.replace('className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"', 'className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center"')

        with open(file, 'w') as f:
            f.write(content)
        print(f"Updated {file}")
