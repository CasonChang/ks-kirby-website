
import re

file_path = '/home/node/.openclaw/workspace/ks-kirby-website/scripts/build.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- FIX 1: Dev Notes Script cleanup ---
# We need to replace the block from the month-select listener to the end of the IIFE
# The current broken part is:
#   document.getElementById('month-select').addEventListener('change', function(){
#     currentIdx = 0;
#   document.getElementById('month-select').value = data.months[0] || 'all';
#   document.getElementById('date-select').value = data.dateKeys[0] || 'all';
#   render();
# })();
#
# And it's followed by the date-select listener and default init.

# Pattern to find the problematic month-select listener and the weird IIFE closing
pattern_dev = r"document\.getElementById\('month-select'\)\.addEventListener\('change', function\(\)\{.*?\n\s+render\(\);\n\}\)\(\);"
# Actually, the file content shows:
#   document.getElementById('month-select').addEventListener('change', function(){
#     currentIdx = 0;
#   document.getElementById('month-select').value = data.months[0] || 'all';
#   document.getElementById('date-select').value = data.dateKeys[0] || 'all';
#   render();
# })();
# This is very broken.

# Let's replace the whole block starting from the month-select listener up to just before the date-select listener.
# Using a more robust replacement for the specific broken section:
old_dev_block = """  document.getElementById('month-select').addEventListener('change', function(){
    currentIdx = 0;
  document.getElementById('month-select').value = data.months[0] || 'all';
  document.getElementById('date-select').value = data.dateKeys[0] || 'all';
  render();
})();"""

new_dev_block = """  document.getElementById('month-select').addEventListener('change', function(){
    currentIdx = 0;
    document.getElementById('date-select').value = 'all';
    render();
  });"""

content = content.replace(old_dev_block, new_dev_block)

# --- FIX 2: English Learning Script (missing 'months' definition) ---
# Find:
#   // Default to latest
#   if (months && months.length > 0) {
#     document.getElementById('english-month').value = months[0];
#   }

# We need to add:
#   var months = [...new Set(dates.map(function(d){ return d.date.substring(0,7); }))].sort(function(a,b){ return b.localeCompare(a); });
#   // Default to latest

old_en_block = """  // Default to latest
  if (months && months.length > 0) {
    document.getElementById('english-month').value = months[0];
  }"""

new_en_block = """  var months = [...new Set(dates.map(function(d){ return d.date.substring(0,7); }))].sort(function(a,b){ return b.localeCompare(a); });
  // Default to latest
  if (months && months.length > 0) {
    document.getElementById('english-month').value = months[0];
  }"""

content = content.replace(old_en_block, new_en_block)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
