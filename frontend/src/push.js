import { api } from "./api.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

// Register the SW, request permission, subscribe, and store on the server.
// Throws with a friendly message on failure. Requires a secure context (HTTPS/localhost).
export async function enablePush() {
  if (!pushSupported()) throw new Error("Push isn't supported on this device or browser.");
  if (!window.isSecureContext) throw new Error("Push needs a secure (https) connection.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications weren't allowed.");

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const { key } = await api.getVapidKey();
  if (!key) throw new Error("Server isn't configured for push yet.");

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  await api.subscribePush(sub);
  await api.testPush().catch(() => {}); // send a confirmation push
}
