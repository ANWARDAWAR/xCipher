with open('components/console/BulkActionBar.tsx', 'r') as f:
    content = f.read()

target = """      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-max max-w-[calc(100%-2rem)]"
        role="region"
        aria-label="Bulk actions for selected articles"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-2.5 bg-ink text-surface rounded-full shadow-2xl max-w-fit mx-auto">"""

replacement = """      <div
        className="fixed bottom-0 left-0 w-full sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-50 sm:w-max sm:max-w-[calc(100%-2rem)] bg-[var(--surface)] sm:bg-transparent rounded-t-2xl sm:rounded-none p-3 sm:p-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-none border-t border-line sm:border-0"
        role="region"
        aria-label="Bulk actions for selected articles"
      >
        <div className="flex items-center justify-between gap-4 px-2 sm:px-5 py-2 sm:py-2.5 sm:bg-ink text-ink sm:text-surface sm:rounded-full sm:shadow-2xl max-w-full sm:max-w-fit mx-auto overflow-x-auto no-scrollbar">"""

content = content.replace(target, replacement)

# We also need to fix the button colors because on mobile they have light background, text should be ink.
# Currently they have: hover:bg-white/10
# So we need sm:hover:bg-white/10 hover:bg-surface-2
# Let's just wrap the buttons in a div that handles this or let's find the buttons.

# Let's fix the button loop
old_btn = """                    className={
                      isDelete
                        ? "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-[#ff9ea6] hover:bg-bad hover:text-white transition-colors disabled:opacity-50"
                        : "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                    }"""

new_btn = """                    className={
                      isDelete
                        ? "flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full text-bad sm:text-[#ff9ea6] hover:bg-bad hover:text-white transition-colors disabled:opacity-50"
                        : "flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-surface-2 sm:bg-transparent hover:bg-surface-3 sm:hover:bg-white/10 transition-colors disabled:opacity-50"
                    }"""
content = content.replace(old_btn, new_btn)

# Fix close button
old_close = """            className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 ml-1" """
new_close = """            className="shrink-0 p-1.5 rounded-full bg-surface-2 sm:bg-transparent hover:bg-surface-3 sm:hover:bg-white/10 transition-colors disabled:opacity-50 ml-1" """
content = content.replace(old_close, new_close)

with open('components/console/BulkActionBar.tsx', 'w') as f:
    f.write(content)

print("BulkActionBar updated.")
