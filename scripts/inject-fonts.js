const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      @font-face { font-family: 'Inter_400Regular'; src: local('Inter'); font-weight: 400; font-style: normal; }
      @font-face { font-family: 'Inter_500Medium'; src: local('Inter'); font-weight: 500; font-style: normal; }
      @font-face { font-family: 'Inter_600SemiBold'; src: local('Inter'); font-weight: 600; font-style: normal; }
      @font-face { font-family: 'Inter_700Bold'; src: local('Inter'); font-weight: 700; font-style: normal; }
    </style>`;

html = html.replace('</head>', fontLinks + '\n  </head>');
fs.writeFileSync(htmlPath, html);
console.log('✅ Injected Inter font links into dist/index.html');
