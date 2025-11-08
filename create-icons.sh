#!/bin/bash

# Создаем директорию для иконок
mkdir -p src-tauri/icons

# Создаем простой SVG файл
cat > src-tauri/icons/icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3b82f6" rx="64"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">HR</text>
</svg>
EOF

echo "SVG icon created!"
echo "Now run: npm install -g @tauri-apps/cli"
echo "Then run: npm run tauri icon src-tauri/icons/icon.svg"
