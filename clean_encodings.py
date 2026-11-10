import os

files_to_clean = [
    r"c:\mavericks\SilverHands_Unified\frontend\package.json",
    r"c:\mavericks\SilverHands_Unified\frontend\vite.config.js",
    r"c:\mavericks\SilverHands_Unified\frontend\tailwind.config.js",
    r"c:\mavericks\SilverHands_Unified\frontend\postcss.config.js",
    r"c:\mavericks\SilverHands_Unified\frontend\index.html",
]

for root, dirs, files in os.walk(r"c:\mavericks\SilverHands_Unified\frontend\src"):
    for file in files:
        if file.endswith(('.js', '.jsx', '.json', '.css', '.html')):
            files_to_clean.append(os.path.join(root, file))

for fpath in files_to_clean:
    if os.path.exists(fpath):
        with open(fpath, 'rb') as f:
            data = f.read()
        # Strip UTF-8 BOM if present
        if data.startswith(b'\xef\xbb\xbf'):
            data = data[3:]
        # Strip UTF-16 BOM if present
        elif data.startswith(b'\xff\xfe') or data.startswith(b'\xfe\xff'):
            data = data.decode('utf-16').encode('utf-8')
        with open(fpath, 'wb') as f:
            f.write(data)

print(f"Cleaned {len(files_to_clean)} frontend files!")
