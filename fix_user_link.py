import re

with open('app/admin/(authenticated)/users/UserDirectoryTable.tsx', 'r') as f:
    content = f.read()

# Replace <Link href={`/author/... with <a href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/author/...
target_link = re.search(r'<Link\s+href=\{`/author/\$\{user\.authorProfile\.slug\}`\}(.*?)>(\s*<ExternalLink[^>]*>\s*<span>Profile</span>\s*)</Link>', content, re.DOTALL)
if target_link:
    new_link = f'<a\n                                      href={{`${{process.env.NEXT_PUBLIC_SITE_URL || \'\'}}/author/${{user.authorProfile.slug}}`}}{target_link.group(1)}rel="noopener noreferrer">{target_link.group(2)}</a>'
    content = content.replace(target_link.group(0), new_link)

with open('app/admin/(authenticated)/users/UserDirectoryTable.tsx', 'w') as f:
    f.write(content)

print("Fixed UserDirectoryTable.tsx")
