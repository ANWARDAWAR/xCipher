import re

# Task 1: Fix the Sticky Toolbar
with open('components/editorial/EditorToolbar.tsx', 'r') as f:
    toolbar_content = f.read()

# Replace the classes to ensure it matches the requested sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)]
toolbar_content = toolbar_content.replace(
    'className="sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--line)] py-2 md:mb-8 flex md:flex-wrap items-center gap-1 mx-auto w-full overflow-x-auto overflow-y-hidden md:max-w-3xl px-2 md:px-0 shadow-md md:shadow-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"',
    'className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)] py-2 md:mb-8 flex md:flex-wrap items-center gap-1 mx-auto w-full overflow-x-auto overflow-y-hidden md:max-w-3xl px-2 md:px-0 shadow-md md:shadow-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"'
)

# Task 3: Fix Add URL Markdown Bug
old_link = 'editor.chain().focus().insertContent(`[${url}](${url}) `).run();'
new_link = "editor.chain().focus().insertContent('[' + url + '](' + url + ')').run();"
if old_link in toolbar_content:
    toolbar_content = toolbar_content.replace(old_link, new_link)
else:
    # If it was the HTML version
    old_link2 = 'editor.chain().focus().insertContent(`<a href="${url}">${url}</a> `).run();'
    toolbar_content = toolbar_content.replace(old_link2, new_link)

with open('components/editorial/EditorToolbar.tsx', 'w') as f:
    f.write(toolbar_content)

# Task 2: Fix Table Missing Right Border (Desktop)
with open('app/globals.css', 'a') as f:
    f.write("\n.tableWrapper, .table-wrapper { padding-right: 1px; }\n")


# Task 4: Enable Image Click-to-Edit in Bubble Menu
with open('components/editorial/EditorBubbleMenu.tsx', 'r') as f:
    bubble_content = f.read()

bubble_imports = """import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link2,
  Link2Off,
  Highlighter,
  Check,
  X,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  ImagePlus
} from "lucide-react";
import { InsertMediaDialog } from "./InsertMediaDialog";"""

bubble_content = re.sub(
    r'import \{\s*Bold,.*?\s*\} from "lucide-react";', 
    bubble_imports, 
    bubble_content, 
    flags=re.DOTALL
)

bubble_state = """  const [isTouch, setIsTouch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [mediaSession, setMediaSession] = useState(0);
  const [mediaKind, setMediaKind] = useState<"image" | "video" | null>(null);
  const [initialMedia, setInitialMedia] = useState<any>(null);

  const openMedia = useCallback((kind: "image", currentAttrs?: any) => {
    setMediaSession((n) => n + 1);
    setMediaKind(kind);
    setInitialMedia(currentAttrs || null);
  }, []);

  const insertImage = useCallback(
    (v: { src: string; alt: string; caption: string; credit: string }) => {
      (editor?.chain().focus() as any).setFigure(v).run();
    },
    [editor]
  );"""

bubble_content = bubble_content.replace(
    '  const [isTouch, setIsTouch] = useState(false);\n  const inputRef = useRef<HTMLInputElement>(null);',
    bubble_state
)

# Fix shouldShow
old_should_show = """      shouldShow={({ editor: ed, from, to }) => {
        // Never over an atom such as a video: the marks would not apply and the
        // menu would float over the block with nothing useful on it.
        if (ed.isActive("youtubeEmbed") || ed.isActive("figure")) return false;
        // Inside a code block the marks are meaningless too.
        if (ed.isActive("codeBlock")) return false;
        if (linkMode) return true;
        return from !== to;
      }}"""

new_should_show = """      shouldShow={({ editor: ed, from, to }) => {
        if (ed.isActive("youtubeEmbed")) return false;
        if (ed.isActive("codeBlock")) return false;
        if (ed.isActive("figure")) return true;
        if (linkMode) return true;
        return from !== to;
      }}"""
bubble_content = bubble_content.replace(old_should_show, new_should_show)

# Fix render
old_render = """    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: ed, from, to }) => {"""
      
new_render = """    <>
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: ed, from, to }) => {"""
bubble_content = bubble_content.replace(old_render, new_render)

old_inner = """    >
      {linkMode ? ("""
new_inner = """    >
      {editor.isActive("figure") ? (
        <div className="eb-row" role="toolbar" aria-label="Image options">
          <MarkButton
            icon={ImagePlus}
            label="Edit Image Attributes"
            active={false}
            onClick={() => openMedia('image', editor.getAttributes('figure'))}
          />
        </div>
      ) : linkMode ? ("""
bubble_content = bubble_content.replace(old_inner, new_inner)

old_end = """    </BubbleMenu>
  );"""
new_end = """    </BubbleMenu>
      <InsertMediaDialog
        key={mediaSession}
        kind={mediaKind ?? 'image'}
        open={mediaKind !== null}
        onClose={() => setMediaKind(null)}
        onInsertImage={insertImage}
        onInsertVideo={() => {}}
        initialImage={initialMedia}
      />
    </>
  );"""
bubble_content = bubble_content.replace(old_end, new_end)

with open('components/editorial/EditorBubbleMenu.tsx', 'w') as f:
    f.write(bubble_content)

print("All tasks completed.")
