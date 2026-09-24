css_to_append = """
/* Ultimate Toast Centering Override */
div.toast {
  position: fixed !important;
  z-index: 99999 !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  margin: 0 !important;
  width: calc(100% - 32px) !important;
  max-width: 400px !important;
  bottom: 24px !important;
}
@media (min-width: 640px) {
  div.toast {
    bottom: auto !important;
    top: 24px !important;
    width: auto !important;
    min-width: 300px !important;
  }
}
"""

with open('app/globals.css', 'a') as f:
    f.write(css_to_append)

print("CSS appended.")
