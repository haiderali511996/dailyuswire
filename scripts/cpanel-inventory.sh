#!/usr/bin/env bash
# Run this ON THE CPANEL SERVER over SSH. It reports the exact values needed
# for the GitHub secrets and variables in DEPLOYMENT.md Step 5.
#
#   bash ~/cpanel-inventory.sh
#
# It only reads - it creates and changes nothing.

echo "=============================================="
echo " cPanel deployment inventory"
echo "=============================================="
echo
echo "Account"
echo "  user       : $(whoami)"
echo "  home       : $HOME"
echo "  server     : $(hostname -f 2>/dev/null || hostname)"
echo

echo "GitHub secrets: paths"
API="$HOME/apps/api"; WEB="$HOME/apps/web"
printf '  CPANEL_USER      = %s\n' "$(whoami)"
printf '  CPANEL_API_PATH  = %s  %s\n' "$API" "$([ -d "$API" ] && echo '[exists]' || echo '[NOT CREATED YET]')"
printf '  CPANEL_WEB_PATH  = %s  %s\n' "$WEB" "$([ -d "$WEB" ] && echo '[exists]' || echo '[NOT CREATED YET]')"
echo

echo "Python virtualenv (created by cPanel > Setup Python App)"
found=0
if [ -d "$HOME/virtualenv" ]; then
  while IFS= read -r act; do
    found=1
    printf '  CPANEL_PY_ACTIVATE = %s\n' "$act"
    printf '                       (python %s)\n' "$("${act%/activate}/python" -V 2>&1 | awk '{print $2}')"
  done < <(find "$HOME/virtualenv" -name activate -path '*/bin/*' 2>/dev/null | sort)
fi
[ "$found" = 0 ] && echo "  none found - create the Python app in cPanel first (Step 3)"
echo

echo "Interpreters available"
echo "  system python : $(python3 -V 2>&1)"
for n in node nodejs; do
  command -v "$n" >/dev/null 2>&1 && echo "  $n          : $("$n" -v 2>&1)"
done
if [ -d /opt/alt ]; then
  echo "  alt pythons   : $(ls -d /opt/alt/python*/ 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')"
  echo "  alt nodes     : $(ls -d /opt/alt/alt-nodejs*/ 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')"
fi
echo

echo "SSH key authorisation"
AK="$HOME/.ssh/authorized_keys"
if [ -s "$AK" ]; then
  echo "  authorized_keys has $(grep -c '^ssh-' "$AK" 2>/dev/null || echo 0) key(s):"
  ssh-keygen -lf "$AK" 2>/dev/null | sed 's/^/    /'
else
  echo "  authorized_keys is missing or empty - the deploy key is NOT authorised"
fi
echo

echo "App directories"
for d in "$API" "$WEB"; do
  if [ -d "$d" ]; then
    echo "  $d"
    ls -A "$d" 2>/dev/null | head -8 | sed 's/^/      /'
    [ -d "$d/tmp" ] && echo "      (tmp/ present - Passenger restart works)"
  fi
done
echo

echo "Disk"
quota -s 2>/dev/null | tail -2 | sed 's/^/  /' || df -h "$HOME" 2>/dev/null | tail -1 | sed 's/^/  /'
echo
echo "=============================================="
echo "Next: create any directory marked NOT CREATED YET"
echo "via cPanel > Setup Python App / Setup Node.js App."
echo "=============================================="
