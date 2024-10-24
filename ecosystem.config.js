module.exports = {
  apps: [{
    name: 'shopify-discount-app',
    script: 'web/index.js',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
    // Logging configuration
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    merge_logs: true,
    // Performance monitoring
    max_memory_restart: '300M',
    // Clustering
    instances: 'max',
    exec_mode: 'cluster',
    // Error handling
    max_restarts: 10,
    min_uptime: '5s',
    // Metrics
    metrics: {
      http: true,
      deep_metrics: true,
    },
    // Health check
    exp_backoff_restart_delay: 100,
  }],
};
