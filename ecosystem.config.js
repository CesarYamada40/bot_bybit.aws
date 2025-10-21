module.exports = {
  apps: [
    {
      name: 'bot-bybit',
      script: './server.js',
      env: {
        PORT: 3000,
        BYBIT_KEY: '',
        BYBIT_SECRET: '',
        API_KEY: ''
      }
    }
  ]
};
