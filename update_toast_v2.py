import re

with open('lib/utils.ts', 'r') as f:
    content = f.read()

# Replace the existing toast appending logic
target = """  const existing = document.getElementById("toast");
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
  if (toastTimer) clearTimeout(toastTimer);

  const t = document.createElement("div");
  t.id = "toast";
  t.dataset.type = resolved;

  const assertive = resolved === 'error';
  t.setAttribute("role", assertive ? "alert" : "status");
  t.setAttribute("aria-live", assertive ? "assertive" : "polite");

  const iconColors = {
    error: "text-red-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
    default: "text-gray-500",
  };
  const iconColor = iconColors[resolved] || iconColors.default;

  let bgClass = "bg-[#1e1e1e] border-white/20";
  if (resolved === 'error') bgClass = "bg-red-950 border-red-500/50";
  if (resolved === 'success') bgClass = "bg-green-950 border-green-500/50";

  const classes = ["toast", "show", "fixed", "z-[99999]", "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border", "bottom-4", "left-1/2", "-translate-x-1/2", "w-[calc(100%-32px)]", "max-w-sm", "sm:bottom-4", "sm:right-4", "sm:left-auto", "sm:translate-x-0", "sm:w-auto"];
  if (variant === "premium") classes.push("toast-premium");
  
  t.className = `${classes.join(" ")} ${bgClass}`;
  const icon = document.createElement("div");
  icon.className = `${iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0`;
  icon.innerHTML = TOAST_ICONS[resolved];

  // The icon is trusted static markup; the message is not. Using textContent
  // prevents article titles and server errors from becoming executable HTML.
  const message = document.createElement("span");
  message.className = "text-base font-medium tracking-tight";
  message.textContent = msg;
  t.append(icon, message);

  document.body.appendChild(t);"""

replacement = """  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "fixed inset-0 z-[99999] pointer-events-none flex flex-col justify-end items-center sm:items-end p-4 pb-4 sm:pb-4";
    document.body.appendChild(container);
  }

  const existing = document.getElementById("toast");
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }
  if (toastTimer) clearTimeout(toastTimer);

  const t = document.createElement("div");
  t.id = "toast";
  t.dataset.type = resolved;

  const assertive = resolved === 'error';
  t.setAttribute("role", assertive ? "alert" : "status");
  t.setAttribute("aria-live", assertive ? "assertive" : "polite");

  const iconColors = {
    error: "text-red-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    info: "text-blue-500",
    default: "text-gray-500",
  };
  const iconColor = iconColors[resolved] || iconColors.default;

  let bgClass = "bg-[#1e1e1e] border-white/20";
  if (resolved === 'error') bgClass = "bg-red-950 border-red-500/50";
  if (resolved === 'success') bgClass = "bg-green-950 border-green-500/50";

  const classes = [
    "toast", "show", "pointer-events-auto", "w-full", "max-w-sm", "sm:w-auto",
    "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border"
  ];
  if (variant === "premium") classes.push("toast-premium");
  
  t.className = f"{classes.join(' ')} {bgClass}";
  const icon = document.createElement("div");
  icon.className = f"{iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0";
  icon.innerHTML = TOAST_ICONS[resolved];

  const message = document.createElement("span");
  message.className = "text-base font-medium tracking-tight";
  message.textContent = msg;
  t.append(icon, message);

  container.appendChild(t);"""

# Let's fix the template strings inside replacement
replacement = replacement.replace("f\"{classes.join(' ')} {bgClass}\"", "`${classes.join(' ')} ${bgClass}`")
replacement = replacement.replace("f\"{iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0\"", "`${iconColor} [&>svg]:w-6 [&>svg]:h-6 shrink-0`")

if target in content:
    content = content.replace(target, replacement)
    with open('lib/utils.ts', 'w') as f:
        f.write(content)
    print("Toast updated.")
else:
    print("Target not found.")
