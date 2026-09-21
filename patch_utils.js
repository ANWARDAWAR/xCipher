const fs = require('fs');
const file = '/home/lord/Music/GRID-X html/lib/utils.ts';
let content = fs.readFileSync(file, 'utf8');

const newToastLogic = `
  let t = document.getElementById("toast");
  let isNew = false;
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    isNew = true;
  }

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

  if (variant === 'premium') {
    t.className = "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col items-center justify-center gap-3 bg-[var(--surface)]/90 backdrop-blur-xl text-[var(--ink)] shadow-2xl rounded-2xl px-8 py-6 border border-[var(--line)] ring-1 ring-white/10 transition-all duration-500" + (isNew ? " opacity-0 scale-95" : " opacity-100 scale-100");
    
    t.innerHTML = \`
      <div class="\${iconColor} mb-2 [&>svg]:w-10 [&>svg]:h-10 transition-colors duration-300">
        \${TOAST_ICONS[resolved]}
      </div>
      <span class="text-lg font-semibold tracking-tight text-center">\${msg}</span>
    \`;
  } else {
    t.className = "fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[var(--surface)] text-[var(--ink)] shadow-2xl rounded-full px-6 py-3 border border-[var(--line)] transition-all duration-300" + (isNew ? " opacity-0 -translate-y-4" : " opacity-100 translate-y-0");

    t.innerHTML = \`<span class="\${iconColor} transition-colors duration-300">\${TOAST_ICONS[resolved]}</span><span class="text-sm font-medium">\${msg}</span>\`;
  }

  if (isNew) {
    const toastRoot = document.getElementById("toast-root");
    if (toastRoot) {
      toastRoot.appendChild(t);
    } else {
      document.body.appendChild(t);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (variant === 'premium') {
          t.classList.remove("opacity-0", "scale-95");
          t.classList.add("opacity-100", "scale-100");
        } else {
          t.classList.remove("opacity-0", "-translate-y-4");
          t.classList.add("opacity-100", "translate-y-0");
        }
      });
    });
  }
`;

content = content.replace(/let t = document\.getElementById\("toast"\);[\s\S]*?requestAnimationFrame\(\(\) => \{\n\s*if \(variant === 'premium'\) \{\s*t\.classList\.remove\("opacity-0", "scale-95"\);\s*t\.classList\.add\("opacity-100", "scale-100"\);\s*\} else \{\s*t\.classList\.remove\("opacity-0", "-translate-y-4"\);\s*t\.classList\.add\("opacity-100", "translate-y-0"\);\s*\}\s*\}\);\s*\}\);/m, newToastLogic);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched utils.ts");
