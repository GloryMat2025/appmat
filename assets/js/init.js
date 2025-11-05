const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if (isDev) {
  console.log('🔧 AppMat running in DEV mode');
  import('/src/main.js'); // bukan ./src, mesti /src
} else {
  console.log('🚀 AppMat running in PROD mode');
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/assets/js/app.js';
  document.head.appendChild(script);
}
