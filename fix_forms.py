import re

# 1. ProfileForm.tsx
with open('app/admin/(authenticated)/settings/ProfileForm.tsx', 'r') as f:
    content = f.read()

# Add overflow-hidden and max-w-full to the main form
content = content.replace('className="w-full max-w-4xl mx-auto pb-32"', 'className="w-full max-w-4xl mx-auto pb-32 overflow-hidden max-w-full"')

# Ensure inputs and textareas have max-w-full
content = content.replace('<input\n', '<input\n              className="max-w-full "\n')
content = content.replace('<textarea\n', '<textarea\n              className="max-w-full "\n')

# Add max-w-full to all classes that have w-full bg-[var(--surface)]
content = content.replace('w-full bg-[var(--surface)]', 'w-full max-w-full bg-[var(--surface)]')

with open('app/admin/(authenticated)/settings/ProfileForm.tsx', 'w') as f:
    f.write(content)

# 2. AccountForm.tsx
with open('app/admin/(authenticated)/settings/AccountForm.tsx', 'r') as f:
    content = f.read()

content = content.replace('<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>', '<div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%", overflow: "hidden" }}>')
content = content.replace('className="ed-input', 'className="ed-input max-w-full')

with open('app/admin/(authenticated)/settings/AccountForm.tsx', 'w') as f:
    f.write(content)

# 3. UserDirectoryTable.tsx 
with open('app/admin/(authenticated)/users/UserDirectoryTable.tsx', 'r') as f:
    content = f.read()

target = """                                  {user.authorProfile && (
                                    <Link
                                      href={`/author/${user.authorProfile.slug}`}
                                      target="_blank"
                                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
                                      title="View Public Author Profile"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      <span>Profile</span>
                                    </Link>
                                  )}"""

replacement = """                                  {user.authorProfile ? (
                                    <Link
                                      href={`/author/${user.authorProfile.slug}`}
                                      target="_blank"
                                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
                                      title="View Public Author Profile"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      <span>Profile</span>
                                    </Link>
                                  ) : (
                                    <Link
                                      href="/admin/settings?tab=profile"
                                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors opacity-50"
                                      title="Set up your public profile first"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      <span>Profile</span>
                                    </Link>
                                  )}"""
content = content.replace(target, replacement)
with open('app/admin/(authenticated)/users/UserDirectoryTable.tsx', 'w') as f:
    f.write(content)

print("Forms and UserDirectoryTable patched")
