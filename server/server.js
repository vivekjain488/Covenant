const { createApp } = require("./create-app");

const { app, port } = createApp();

const server = app.listen(port, () => {
  console.log(`Covenant API running on http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Covenant API] Port ${port} is already in use. Stop the existing process or set PORT=3001.`,
    );
    process.exit(1);
  }
  throw err;
});
