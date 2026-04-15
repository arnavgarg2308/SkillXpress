let deferredPrompt;
let installButton;

// Check if user is on iOS
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Check if app is already installed (in standalone mode)
function isInstalledPWA() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

// Don't show install button if already installed
if (isInstalledPWA()) {
  console.log('App already installed');
} else {
  // For iOS - show prompt on page load
  if (isIOS()) {
    window.addEventListener('load', () => {
      showIOSInstallButton();
    });
  }
  
  // For Android - wait for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showAndroidInstallButton();
  });
}

function showIOSInstallButton() {
  const button = document.createElement('button');
  button.id = 'installBtn';
  button.innerHTML = '📱 Add to Home Screen<br><small>Tap Share, then Add to Home Screen</small>';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
    z-index: 9999;
    transition: all 0.3s ease;
    text-align: center;
    line-height: 1.3;
  `;
  
  button.addEventListener('click', () => {
    alert('📱 Tap the Share button (bottom centre) → "Add to Home Screen" → "Add"');
  });
  
  document.body.appendChild(button);
  installButton = button;
}

function showAndroidInstallButton() {
  const button = document.createElement('button');
  button.id = 'installBtn';
  button.textContent = '📱 Install App';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
    z-index: 9999;
    transition: all 0.3s ease;
  `;
  
  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.6)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.4)';
  });
  
  button.addEventListener('click', handleAndroidInstall);
  document.body.appendChild(button);
  installButton = button;
}

function handleAndroidInstall() {
  if (!deferredPrompt) {
    return;
  }
  
  deferredPrompt.prompt();
  
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('App installed');
      if (installButton) {
        installButton.style.display = 'none';
      }
    } else {
      console.log('Install cancelled');
    }
    deferredPrompt = null;
  });
}

// Hide install button when app is installed
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  if (installButton) {
    installButton.style.display = 'none';
  }
  deferredPrompt = null;
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
