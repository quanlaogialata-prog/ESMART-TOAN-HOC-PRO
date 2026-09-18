import fs from 'fs';

let content = fs.readFileSync('src/main.tsx', 'utf8');

const swScript = `
// Unregister any leftover service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then(
        (success) => console.log('ServiceWorker unregistered:', success)
      );
    }
  });
}

createRoot`;

content = content.replace("createRoot", swScript);

fs.writeFileSync('src/main.tsx', content);
