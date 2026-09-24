import re

with open('components/editorial/InsertMediaDialog.tsx', 'r') as f:
    content = f.read()

# Add initialImage to Props
content = content.replace(
    '  kind: MediaKind;',
    '  kind: MediaKind;\n  initialImage?: { src?: string; alt?: string; caption?: string; credit?: string } | null;'
)

# Update component signature
content = content.replace(
    'export function InsertMediaDialog({ kind, open, onClose, onInsertImage, onInsertVideo }: Props) {',
    'export function InsertMediaDialog({ kind, open, onClose, onInsertImage, onInsertVideo, initialImage }: Props) {'
)

# Update useState initial values
content = content.replace(
    'const [src, setSrc] = useState("");\n  const [alt, setAlt] = useState("");\n  const [caption, setCaption] = useState("");\n  const [credit, setCredit] = useState("");',
    'const [src, setSrc] = useState(initialImage?.src || "");\n  const [alt, setAlt] = useState(initialImage?.alt || "");\n  const [caption, setCaption] = useState(initialImage?.caption || "");\n  const [credit, setCredit] = useState(initialImage?.credit || "");'
)

# Update Tab initialization so it opens "url" if there is an initialImage (because editing)
content = content.replace(
    'const [tab, setTab] = useState<"upload" | "url">("upload");',
    'const [tab, setTab] = useState<"upload" | "url">(initialImage?.src ? "url" : "upload");'
)

# Update button text
content = content.replace(
    '{isImage ? "Insert image" : "Insert video"}',
    '{isImage ? (initialImage ? "Update Image" : "Insert image") : "Insert video"}'
)

with open('components/editorial/InsertMediaDialog.tsx', 'w') as f:
    f.write(content)

print("InsertMediaDialog updated.")
