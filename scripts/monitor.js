const pm2 = require('pm2');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Connect to PM2
pm2.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(2);
  }

  // Monitor application
  pm2.launchBus((err, bus) => {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    // Listen for process errors
    bus.on('process:exception', (data) => {
      const subject = `[ALERT] Exception in ${data.process.name}`;
      const message = `
        Process: ${data.process.name}
        Time: ${new Date()}
        Exception: ${data.data.message}
        Stack: ${data.data.stack}
      `;

      sendAlert(subject, message);
    });

    // Listen for process exits
    bus.on('process:event', (data) => {
      if (data.event === 'exit') {
        const subject = `[ALERT] Process ${data.process.name} exited`;
        const message = `
          Process: ${data.process.name}
          Time: ${new Date()}
          Status: Exited
        `;

        sendAlert(subject, message);
      }
    });
  });
});

// Send alert email
function sendAlert(subject, message) {
  const mailOptions = {
    from: process.env.ALERT_FROM_EMAIL,
    to: process.env.ALERT_TO_EMAIL,
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending alert:', error);
    } else {
      console.log('Alert sent:', info.response);
    }
  });
}

// Check system resources
setInterval(() => {
  pm2.list((err, list) => {
    if (err) {
      console.error(err);
      return;
    }

    list.forEach((process) => {
      if (process.monit.memory > 300 * 1024 * 1024) { // 300MB
        const subject = `[ALERT] High memory usage in ${process.name}`;
        const message = `
          Process: ${process.name}
          Memory Usage: ${Math.round(process.monit.memory / 1024 / 1024)}MB
          CPU Usage: ${process.monit.cpu}%
          Time: ${new Date()}
        `;

        sendAlert(subject, message);
      }
    });
  });
}, 5 * 60 * 1000); // Check every 5 minutes
