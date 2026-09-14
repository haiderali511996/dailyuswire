/**
 * Passenger entry point for cPanel's "Setup Node.js App".
 *
 * Deployed to the app root as `app.js`, which is cPanel's default startup
 * filename, so the Node app needs no extra configuration in the UI.
 *
 * It boots the Next.js standalone server that sits beside it. Passenger sets
 * PORT and intercepts listen(), so the standalone server binds wherever
 * Passenger tells it to.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.HOSTNAME = process.env.HOSTNAME || '127.0.0.1';
process.env.NEXT_TELEMETRY_DISABLED = '1';

require('./server.js');
