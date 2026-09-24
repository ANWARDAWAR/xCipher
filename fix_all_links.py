import re

# 1. AuthorDirectoryTable.tsx
with open('app/admin/(authenticated)/authors/AuthorDirectoryTable.tsx', 'r') as f:
    content = f.read()

content = content.replace('<Link\n                    href={`/author/${a.slug}`}', '<a\n                    href={`${process.env.NEXT_PUBLIC_SITE_URL || \'\'}/author/${a.slug}`}')
content = content.replace('aria-label={`View public profile for ${a.name}`}\n                  >\n                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />\n                  </Link>', 'aria-label={`View public profile for ${a.name}`}\n                  >\n                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />\n                  </a>')

with open('app/admin/(authenticated)/authors/AuthorDirectoryTable.tsx', 'w') as f:
    f.write(content)

# 2. UserDirectoryTable.tsx
with open('app/admin/(authenticated)/users/UserDirectoryTable.tsx', 'r') as f:
    content = f.read()

content = content.replace('<Link\n                                      href={`/author/${user.authorProfile.slug}`}', '<a\n                                      href={`${process.env.NEXT_PUBLIC_SITE_URL || \'\'}/author/${user.authorProfile.slug}`}')
content = content.replace('<span>Profile</span>\n                                    </Link>', '<span>Profile</span>\n                                    </a>')
# Fix the alternative branch as well if there's a Link that we mistakenly close with </a>.
# Wait, the other one is `<Link href="/admin/settings?tab=profile" ... <span>Profile</span> </Link>`.
# We need to be careful with replace!
