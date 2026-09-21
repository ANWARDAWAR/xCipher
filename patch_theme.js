const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'app/globals.css');
let content = fs.readFileSync(file, 'utf8');

// Replace light mode
content = content.replace(
  /:root \{\n  --paper: #f8f9fa;\n  --surface: #ffffff;\n  --surface-2: #f1f3f5;\n  --surface-3: #e9ecef;\n  --bg: var\(--paper\);\n  --bg-elevated: var\(--surface\);\n  --ink: #0f141a;\n  --ink-2: #242c35;\n  --muted: #596370;\n  --faint: #8c96a3;\n  --line: #e2e4e8;\n  --line-2: #d0d4da;\n  --accent: #d92332;\n  --accent-deep: #b01726;\n  --accent-soft: rgba\(217, 35, 50, \.07\);\n  \/\* Pressed state. hover and active previously mapped to the same token, which\n     left buttons with no press feedback; this is one step beyond --accent-deep\n     in the same direction the theme darkens\. \*\/\n  --accent-press: #8f1220;\n  \/\* Foreground for text\/icons sitting ON an accent fill\. White clears 4\.5:1 on\n     every light-theme accent step \(4\.96 \/ 7\.01 \/ 9\.23\)\. \*\/\n  --on-accent: #ffffff;/,
  `:root {
  --paper: #ffffff;
  --surface: #fcfcfc;
  --surface-2: #f2f2f2;
  --surface-3: #e6e6e6;
  --bg: var(--paper);
  --bg-elevated: var(--surface);
  --ink: #000000;
  --ink-2: #1a1a1a;
  --muted: #595959;
  --faint: #8c8c8c;
  --line: #e6e6e6;
  --line-2: #cccccc;
  --accent: #e60000;
  --accent-deep: #cc0000;
  --accent-soft: rgba(230, 0, 0, .07);
  /* Pressed state. hover and active previously mapped to the same token, which
     left buttons with no press feedback; this is one step beyond --accent-deep
     in the same direction the theme darkens. */
  --accent-press: #990000;
  /* Foreground for text/icons sitting ON an accent fill. White clears 4.5:1 on
     every light-theme accent step (4.96 / 7.01 / 9.23). */
  --on-accent: #ffffff;`
);

// Replace dark mode
content = content.replace(
  /\[data-theme="dark"\] \{\n  --paper: #0d1117;\n  --surface: #161b22;\n  --surface-2: #21262d;\n  --surface-3: #30363d;\n  --bg: var\(--paper\);\n  --bg-elevated: var\(--surface\);\n  --ink: #e2e8f0;\n  --ink-2: #94a3b8;\n  --muted: #64748b;\n  --faint: #475569;\n  --line: #30363d;\n  --line-2: #3d444d;\n  --accent: #f04552;\n  --accent-deep: #ff6973;\n  --accent-soft: rgba\(240, 69, 82, \.1\);\n  \/\* Dark theme brightens rather than darkens, so the press step continues up\. \*\/\n  --accent-press: #ff8a92;\n  \/\* Foreground for text\/icons sitting ON an accent fill\. Must always remain pure white \(#ffffff\)\n     in both light and dark modes to guarantee contrast against the red accent background\. \*\/\n  --on-accent: #ffffff;/,
  `[data-theme="dark"] {
  --paper: #050505;
  --surface: #0a0a0a;
  --surface-2: #141414;
  --surface-3: #1f1f1f;
  --bg: var(--paper);
  --bg-elevated: var(--surface);
  --ink: #ffffff;
  --ink-2: #e6e6e6;
  --muted: #a6a6a6;
  --faint: #737373;
  --line: #1f1f1f;
  --line-2: #333333;
  --accent: #ff1a1a;
  --accent-deep: #ff4d4d;
  --accent-soft: rgba(255, 26, 26, .1);
  /* Dark theme brightens rather than darkens, so the press step continues up. */
  --accent-press: #ff8080;
  /* Foreground for text/icons sitting ON an accent fill. Must always remain pure white (#ffffff)
     in both light and dark modes to guarantee contrast against the red accent background. */
  --on-accent: #ffffff;`
);

// Inject .btn-premium styles
const btnStyles = `

        /* Premium Buttons */
        .btn-premium {
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
            color: var(--on-accent);
            border: 1px solid transparent;
            box-shadow: 0 4px 14px 0 var(--accent-soft);
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-premium::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transform: skewX(-20deg);
            transition: all 0.5s ease;
        }

        .btn-premium:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(230, 0, 0, 0.25);
            background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-press) 100%);
        }

        [data-theme="dark"] .btn-premium:hover {
            box-shadow: 0 6px 20px 0 rgba(255, 26, 26, 0.25);
        }

        .btn-premium:hover::after {
            left: 150%;
        }

        .btn-premium:active {
            transform: translateY(0);
            box-shadow: 0 2px 10px 0 var(--accent-soft);
        }

        .btn-premium:disabled {
            opacity: 0.7;
            transform: none;
            box-shadow: none;
            cursor: not-allowed;
        }
`;

content = content.replace(/\/\* chips \/ badges \*\//, btnStyles + '\n        /* chips / badges */');

fs.writeFileSync(file, content);
console.log('Patched globals.css theme and buttons');
