module.exports = {
    apps : [{
        name: "srs_auto_transfer",
        script: "./build/server.js",
        watch: ["start", "config", "app", "resources"],
        ignore_watch : ["node_modules", "tmp", "public", "server.js"],
        cron_restart: '*/15 * * * *',
        instances : "max",
        exec_mode : "cluster"
    }]
}