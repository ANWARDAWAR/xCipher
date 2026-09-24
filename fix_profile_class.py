import re

with open('app/admin/(authenticated)/settings/ProfileForm.tsx', 'r') as f:
    content = f.read()

# Fix the duplicate className we introduced
content = re.sub(r'className="max-w-full "\s*(.*?)\s*className="([^"]+)"', r'\1 className="max-w-full \2"', content, flags=re.DOTALL)
content = re.sub(r'className="max-w-full "\s*className="([^"]+)"', r'className="max-w-full \1"', content)

with open('app/admin/(authenticated)/settings/ProfileForm.tsx', 'w') as f:
    f.write(content)

with open('app/admin/(authenticated)/settings/AccountForm.tsx', 'r') as f:
    content = f.read()
# Account form had: content = content.replace('className="ed-input', 'className="ed-input max-w-full')
# That's perfectly fine, no duplicate className created, it just modified the string inside the className.

print("Fixed ProfileForm.tsx")
