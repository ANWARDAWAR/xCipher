import re

with open('app/admin/(authenticated)/settings/page.tsx', 'r') as f:
    content = f.read()

# Fix the disabled button text
content = content.replace(
    'title="Save your profile first to view it live.">\n                      View Live\n                    </span>',
    'title="Save your profile first to view it live.">\n                      View Live (Save Profile First)\n                    </span>'
)

# Fix the relative href to absolute
content = content.replace(
    'href={`/author/${author.slug}`}',
    'href={`${process.env.NEXT_PUBLIC_SITE_URL || \'\'}/author/${author.slug}`}'
)

with open('app/admin/(authenticated)/settings/page.tsx', 'w') as f:
    f.write(content)

print("Fixed href and disabled button text")
