import re

# Task 1: Force Toast Centering
with open('lib/utils.ts', 'r') as f:
    content = f.read()

target_classes = """  const classes = [
    "toast", "show", "fixed", "z-[9999]", 
    "left-1/2", "-translate-x-1/2", // Center horizontally globally
    "bottom-6", "w-[calc(100%-32px)]", "max-w-sm", // Mobile positioning
    "sm:bottom-auto", "sm:top-6", "sm:w-auto", "sm:min-w-[300px]", "sm:max-w-md", // Desktop positioning
    "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border",
    "transform", "transition-all", "duration-300"
  ];"""

replacement_classes = """  const classes = [
    "toast", "show", "!fixed", "z-[9999]", 
    "!left-1/2", "!-translate-x-1/2", 
    "!bottom-6", "!w-[calc(100%-32px)]", "max-w-sm", 
    "sm:!bottom-auto", "sm:!top-6", "sm:!w-auto", "sm:!min-w-[300px]", 
    "flex", "items-center", "gap-3", "text-white", "shadow-2xl", "rounded-2xl", "px-6", "py-4", "border", 
    "transition-all", "duration-300"
  ];"""

content = content.replace(target_classes, replacement_classes)
with open('lib/utils.ts', 'w') as f:
    f.write(content)

# Task 2: View Live 404 Fix
with open('app/admin/(authenticated)/settings/page.tsx', 'r') as f:
    content = f.read()

# Replace View Live in the preview section
content = content.replace(
    """                  {author.slug && (
                    <Link href={`/author/${author.slug}`} target="_blank" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                      View Live
                    </Link>
                  )}""",
    """                  {author.slug ? (
                    <Link href={`/author/${author.slug}`} target="_blank" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                      View Live
                    </Link>
                  ) : (
                    <span className="btn btn-ghost opacity-50 cursor-not-allowed" style={{ padding: "6px 12px", borderRadius: "6px" }} title="Save your profile first to view it live.">
                      View Live
                    </span>
                  )}"""
)

# Add View Live in the edit profile section
edit_section_target = """              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px" }}>Edit Profile</h2>
                {author && (
                  <Link href="/admin/settings?tab=profile" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                    Cancel
                  </Link>
                )}
              </div>"""

edit_section_replacement = """              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px" }}>Edit Profile</h2>
                <div style={{ display: "flex", gap: "12px" }}>
                  {!author || !author.slug ? (
                    <span className="btn btn-ghost opacity-50 cursor-not-allowed" style={{ padding: "6px 12px", borderRadius: "6px" }} title="Save your profile first to view it live.">
                      View Live
                    </span>
                  ) : (
                    <Link href={`/author/${author.slug}`} target="_blank" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                      View Live
                    </Link>
                  )}
                  {author && (
                    <Link href="/admin/settings?tab=profile" className="btn btn-ghost" style={{ padding: "6px 12px", borderRadius: "6px" }}>
                      Cancel
                    </Link>
                  )}
                </div>
              </div>"""

content = content.replace(edit_section_target, edit_section_replacement)
with open('app/admin/(authenticated)/settings/page.tsx', 'w') as f:
    f.write(content)

# Task 3: Auto-Scroll to Subscribe Box
files_to_check = [
    'components/layout/SiteHeader.tsx',
    'components/layout/MobileDrawer.tsx',
    'components/layout/SiteFooter.tsx'
]

for file_path in files_to_check:
    try:
        with open(file_path, 'r') as f:
            file_content = f.read()
        
        file_content = file_content.replace('href="/page/newsletters"', 'href="/page/newsletters#subscribe"')
        
        with open(file_path, 'w') as f:
            f.write(file_content)
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

print("All tasks completed")
