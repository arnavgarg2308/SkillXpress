let deferredPrompt;
let installButton;

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event for later use
  deferredPrompt = e;
  // Update UI to show the install button
  showInstallButton();
});

function showInstallButton() {
  // Look for install button with id 'installBtn' or create one if it doesn't exist
  installButton = document.getElementById('installBtn');
  
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', handleInstallClick);
  } else {
    // If no button exists, create a floating button
    createFloatingInstallButton();
  }
}

function createFloatingInstallButton() {
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
  
  button.addEventListener('click', handleInstallClick);
  document.body.appendChild(button);
}

function handleInstallClick() {
  if (!deferredPrompt) {
    return;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
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
