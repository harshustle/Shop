module.exports = {
  apps: [
    {
      name: 'freshcart-api',
      script: './index.js',
      cwd: '/var/www/freshcart/backend',
      instances: 'max', // 1 worker per CPU core (e.g. 4-8 workers on c6i.xlarge/2xlarge)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      node_args: '--max-old-space-size=2048', // 2GB heap per worker
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 64 // Prevent crypto/bcrypt threadpool starvation
      },
      error_file: '/var/log/pm2/freshcart-error.log',
      out_file: '/var/log/pm2/freshcart-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
