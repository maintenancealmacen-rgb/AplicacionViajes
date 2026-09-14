// SW.JS — se ejecuta en segundo plano en el navegador del usuario,
// incluso con la pestaña cerrada, para poder mostrar notificaciones push.

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Nuevo chollo en Volaganga";
  const options = {
    body: data.body || "",
    icon: "assets/img/icon-192.png",
    badge: "assets/img/icon-192.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
