// Monitoring is optional and must never block the learning app.
if (process.env.NODE_ENV === "production") {
  void import("./lib/firebase-monitoring")
    .then(({ startFirebaseMonitoring }) => startFirebaseMonitoring())
    .catch(() => {});
}
