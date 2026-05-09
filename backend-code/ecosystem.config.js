module.exports = {
  apps: [
    {
      name: "aimplify-api",
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 1000,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
