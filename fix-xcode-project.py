import sys
path = sys.argv[1]
with open(path, 'r') as f:
    content = f.read()
content = content.replace('TARGETED_DEVICE_FAMILY = 1;', 'TARGETED_DEVICE_FAMILY = "1,2";')
content = content.replace('TARGETED_DEVICE_FAMILY = "1";', 'TARGETED_DEVICE_FAMILY = "1,2";')
lines = content.split('\n')
new_lines = []
for line in lines:
    if 'ASSETCATALOG_COMPILER_APPICON_NAME' in line:
        continue
    if 'ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS' in line:
        continue
    if 'INFOPLIST_FILE' in line and 'ASSETCATALOG' not in line:
        indent = line[:len(line) - len(line.lstrip())]
        new_lines.append(indent + 'ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;')
        new_lines.append(indent + 'ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = YES;')
    new_lines.append(line)
with open(path, 'w') as f:
    f.write('\n'.join(new_lines))
print("TARGETED_DEVICE_FAMILY set to 1,2")
print("ASSETCATALOG settings added")
import subprocess
result = subprocess.run(['grep', '-c', 'ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS', path], capture_output=True, text=True)
print(f"ASSETCATALOG lines found: {result.stdout.strip()}")
result = subprocess.run(['grep', 'TARGETED_DEVICE_FAMILY', path], capture_output=True, text=True)
print(f"Device family lines:\n{result.stdout}")
