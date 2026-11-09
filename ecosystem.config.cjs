module.exports = {
    apps: [
        {
            name: "nvoid-web-view",
            cwd: "/opt/nvoidai/frontend/nvoidai.com",
            script: "npm",
            args: "start",
            interpreter: "none",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            time: true,
            env: {
                NODE_ENV: "production",
                PORT: 3003,
                HOST: "127.0.0.1"
            }
        }
    ]
};