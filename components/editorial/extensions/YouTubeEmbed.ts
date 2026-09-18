import { mergeAttributes, Node, nodePasteRule } from '@tiptap/core'
import {
  parseYouTubeId,
  youTubeEmbedSrc,
  youTubeThumbnail,
  youTubeWatchUrl,
} from '@/lib/embeds'

// ─────────────────────────────────────────────────────────────────────────────
// YouTube embed node
// ─────────────────────────────────────────────────────────────────────────────
//
// Written here rather than pulled in as @tiptap/extension-youtube, for two
// reasons that both come down to control:
//
//   1. The src has to be exactly what lib/sanitize.ts will accept. The official
//      extension builds its own URL, so the two definitions could drift and the
//      failure would be silent -- video plays in the editor, disappears on
//      publish. Here both sides call youTubeEmbedSrc().
//   2. It avoids a dependency for roughly sixty lines of node definition.
//
// Stored HTML is a <div data-youtube-video> wrapping an <iframe>. That survives
// the sanitizer, and the public page needs no component to render it -- it is
// already a working player in the HTML the reader receives.
//
// Only the id is persisted as an attribute; the src is derived. A stored
// document therefore cannot carry a src we would not generate ourselves.
// ─────────────────────────────────────────────────────────────────────────────

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      /** Insert a video. Accepts any URL shape parseYouTubeId understands;
       *  returns false when the input is not a recognisable video. */
      setYouTubeVideo: (options: { src: string }) => ReturnType
    }
  }
}

/** Matches a YouTube URL occupying a paste on its own. Anchored so a link
 *  inside a sentence stays a link -- turning that into a block-level embed
 *  mid-paragraph would destroy the paragraph. */
const PASTE_RE = /^\s*(https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/\S+)\s*$/

export const YouTubeEmbed = Node.create({
  name: 'youtubeEmbed',
  group: 'block',
  atom: true,       // a single indivisible unit; no cursor inside it
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
        // Read the id back from either the wrapper's data attribute or the
        // iframe src, so documents saved by any earlier shape still load.
        parseHTML: (element) => {
          const explicit = element.getAttribute('data-youtube-id')
          if (explicit && parseYouTubeId(explicit)) return explicit
          const iframe = element.querySelector('iframe')
          return parseYouTubeId(iframe?.getAttribute('src') ?? null)
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.querySelector('iframe')?.getAttribute('title') ?? null,
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-youtube-video]' },
      // Bare iframes pointing at YouTube, e.g. from content pasted out of
      // another CMS. Anything else is left alone for the sanitizer to drop.
      {
        tag: 'iframe',
        getAttrs: (element) => {
          const src = (element as HTMLElement).getAttribute('src')
          const id = parseYouTubeId(src)
          return id ? { videoId: id } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const id = node.attrs.videoId as string | null

    // A node with no valid id must not produce an empty player shell -- that is
    // the "broken blank container" failure. Degrade to nothing; the sanitizer
    // and the reader both see clean markup.
    if (!id || !parseYouTubeId(id)) return ['div', { 'data-youtube-video': '' }]

    const title = (node.attrs.title as string | null) || 'YouTube video player'

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-youtube-video': '',
        'data-youtube-id': id,
        class: 'yt-embed',
      }),
      [
        'iframe',
        {
          src: youTubeEmbedSrc(id),
          title,
          loading: 'lazy',
          frameborder: '0',
          allowfullscreen: '',
          allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        },
      ],
    ]
  },

  addCommands() {
    return {
      setYouTubeVideo:
        (options) =>
        ({ commands }) => {
          const id = parseYouTubeId(options.src)
          // Returning false leaves the editor untouched and lets the caller
          // surface a real error, rather than inserting a dead block.
          if (!id) return false
          return commands.insertContent({ type: this.name, attrs: { videoId: id } })
        },
    }
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: PASTE_RE,
        type: this.type,
        getAttributes: (match) => {
          const id = parseYouTubeId(match[1])
          return id ? { videoId: id } : false
        },
      }),
    ]
  },

  // Rendered in the editor as a thumbnail rather than a live iframe.
  //
  // A long article can hold a dozen videos; instantiating a dozen YouTube
  // players would load the player bundle repeatedly and make typing stutter,
  // which is the specific performance trap with embeds. The author sees the
  // real frame, poster and aspect ratio, and the actual player only ever exists
  // on the published page.
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'yt-embed yt-embed-editing'
      dom.setAttribute('data-youtube-video', '')
      dom.contentEditable = 'false'

      const id = node.attrs.videoId as string | null

      if (!id || !parseYouTubeId(id)) {
        // Explicit, readable failure instead of an empty box.
        dom.classList.add('yt-embed-invalid')
        dom.textContent = 'This video link could not be read. Select this block and delete it, or paste the YouTube URL again.'
        return { dom }
      }

      dom.setAttribute('data-youtube-id', id)

      const frame = document.createElement('div')
      frame.className = 'yt-embed-frame'

      const thumb = document.createElement('img')
      thumb.className = 'yt-embed-thumb'
      thumb.src = youTubeThumbnail(id)
      thumb.alt = ''
      thumb.loading = 'lazy'
      // If the poster 404s the block still reads as a video rather than as a
      // broken image icon.
      thumb.addEventListener('error', () => {
        thumb.remove()
        frame.classList.add('yt-embed-noposter')
      })

      const badge = document.createElement('span')
      badge.className = 'yt-embed-badge'
      badge.textContent = 'YouTube'

      const play = document.createElement('span')
      play.className = 'yt-embed-play'
      play.setAttribute('aria-hidden', 'true')

      frame.append(thumb, play, badge)

      const caption = document.createElement('div')
      caption.className = 'yt-embed-meta'

      const link = document.createElement('a')
      link.href = youTubeWatchUrl(id)
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = youTubeWatchUrl(id)
      link.className = 'yt-embed-url'
      // The node is not editable, so clicks would otherwise be swallowed.
      link.addEventListener('mousedown', (e) => e.stopPropagation())

      caption.append(link)

      if (editor.isEditable) {
        const remove = document.createElement('button')
        remove.type = 'button'
        remove.className = 'yt-embed-remove'
        remove.textContent = 'Remove'
        remove.setAttribute('aria-label', 'Remove this video embed')
        remove.addEventListener('mousedown', (event) => {
          event.preventDefault()
          event.stopPropagation()
          if (typeof getPos !== 'function') return
          const pos = getPos()
          if (typeof pos !== 'number') return
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + node.nodeSize })
            .run()
        })
        caption.append(remove)
      }

      dom.append(frame, caption)

      return {
        dom,
        // No contentDOM: this is an atom. Returning true from ignoreMutation
        // keeps ProseMirror from re-rendering the node every time the poster
        // image finishes loading.
        ignoreMutation: () => true,
      }
    }
  },
})
