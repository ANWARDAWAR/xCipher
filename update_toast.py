import re

with open('lib/utils.ts', 'r') as f:
    content = f.read()

# Find the container logic and remove it
container_pattern = r'  let container = document\.getElementById\("toast-container"\);\s*if \(!container\) \{.*?  \}\s*'
content = re.sub(container_pattern, '', content, flags=re.DOTALL)

# Update the toast classes and append to body instead of container
target = """  const classes = [
    "toast", "show", "pointer-events-auto", "w-full", "max-w-sm", "sm:w-auto",
    "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border"
  ];
  if (variant === "premium") classes.push("toast-premium");
  
  t.className = `${classes.join(' ')} ${bgClass}`;
  const icon = document.createElement("div");
  icon.className = `${iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0`;
  icon.innerHTML = TOAST_ICONS[resolved];

  const message = document.createElement("span");
  message.className = "text-base font-medium tracking-tight";
  message.textContent = msg;
  t.append(icon, message);

  container.appendChild(t);"""

replacement = """  const classes = [
    "toast", "show", "fixed", "z-[9999]", 
    "left-1/2", "-translate-x-1/2", // Center horizontally globally
    "bottom-6", "w-[calc(100%-32px)]", "max-w-sm", // Mobile positioning
    "sm:bottom-auto", "sm:top-6", "sm:w-auto", "sm:min-w-[300px]", "sm:max-w-md", // Desktop positioning
    "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border",
    "transform", "transition-all", "duration-300"
  ];
  if (variant === "premium") classes.push("toast-premium");
  
  t.className = `${classes.join(' ')} ${bgClass}`;
  const icon = document.createElement("div");
  icon.className = `${iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0`;
  icon.innerHTML = TOAST_ICONS[resolved];

  const message = document.createElement("span");
  message.className = "text-base font-medium tracking-tight";
  message.textContent = msg;
  t.append(icon, message);

  document.body.appendChild(t);"""

if target in content:
    content = content.replace(target, replacement)
    with open('lib/utils.ts', 'w') as f:
        f.write(content)
    print("Toast updated.")
else:
    print("Target not found.")
