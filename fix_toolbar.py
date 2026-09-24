import re

with open('components/editorial/EditorToolbar.tsx', 'r') as f:
    content = f.read()

# Fix ToolbarButton onMouseDown
content = content.replace(
    'onClick={onClick}',
    'onMouseDown={(e) => e.preventDefault()}\n      onClick={onClick}'
)

# Fix setLink
old_setLink = """    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        alert('Only http, https, and mailto links are allowed.');
        return;
      }
    } catch {
      alert('Please enter a valid URL.');
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();"""

new_setLink = """    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        alert('Only http, https, and mailto links are allowed.');
        return;
      }
    } catch {
      alert('Please enter a valid URL.');
      return;
    }
    
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a> `).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }"""

content = content.replace(old_setLink, new_setLink)

# Fix Image Dialog opening with initial attributes
old_image_btn = """      <ToolbarButton
        icon={ImagePlus}
        onClick={() => openMedia('image')}
        title="Insert image"
      />"""
new_image_btn = """      <ToolbarButton
        icon={ImagePlus}
        onClick={() => {
          if (editor.isActive('figure')) {
            openMedia('image', editor.getAttributes('figure'));
          } else {
            openMedia('image');
          }
        }}
        isActive={editor.isActive('figure')}
        title={editor.isActive('figure') ? "Update image" : "Insert image"}
      />"""
content = content.replace(old_image_btn, new_image_btn)

# Add currentAttrs to openMedia
content = content.replace(
    'const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);',
    'const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);\n  const [initialMedia, setInitialMedia] = useState<any>(null);'
)

content = content.replace(
    'const openMedia = (kind: MediaKind) => {\n    setMediaSession((n) => n + 1);\n    setMediaKind(kind);\n  };',
    'const openMedia = (kind: MediaKind, currentAttrs?: any) => {\n    setMediaSession((n) => n + 1);\n    setMediaKind(kind);\n    setInitialMedia(currentAttrs || null);\n  };'
)

content = content.replace(
    '<InsertMediaDialog\n        key={mediaSession}\n        kind={mediaKind ?? \'image\'}',
    '<InsertMediaDialog\n        key={mediaSession}\n        kind={mediaKind ?? \'image\'}\n        initialImage={initialMedia}'
)

with open('components/editorial/EditorToolbar.tsx', 'w') as f:
    f.write(content)

print("EditorToolbar updated.")
