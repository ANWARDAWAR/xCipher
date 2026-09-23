import re

with open('lib/utils.ts', 'r') as f:
    content = f.read()

old_classes = 'const classes = ["toast", "show", "fixed", "top-[20px]", "left-1/2", "-translate-x-1/2", "z-[99999]", "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border"];'
new_classes = 'const classes = ["toast", "show", "fixed", "z-[99999]", "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border", "bottom-4", "left-1/2", "-translate-x-1/2", "w-[calc(100%-32px)]", "max-w-sm", "sm:bottom-4", "sm:right-4", "sm:left-auto", "sm:translate-x-0", "sm:w-auto"];'

if old_classes in content:
    content = content.replace(old_classes, new_classes)
    with open('lib/utils.ts', 'w') as f:
        f.write(content)
    print("Toast updated.")
else:
    print("Classes not found.")
