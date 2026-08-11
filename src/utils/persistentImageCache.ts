let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

const serviceWorkerUrl = `${import.meta.env.BASE_URL}image-cache-sw.js`;
const serviceWorkerScope = import.meta.env.BASE_URL;

export function registerPersistentImageCache() {
  if (registrationPromise) return registrationPromise;

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    registrationPromise = Promise.resolve(null);
    return registrationPromise;
  }

  registrationPromise = navigator.serviceWorker
    .register(serviceWorkerUrl, { scope: serviceWorkerScope })
    .then(() => navigator.serviceWorker.ready)
    .catch(() => null);

  return registrationPromise;
}

export async function requestPersistentImageStorage() {
  await registerPersistentImageCache();

  if (!navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
