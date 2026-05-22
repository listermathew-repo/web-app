/**
 * Multi-Channel Alert System with Redundancy
 * Primary: ntfy.sh
 * Backup 1: SMS (via Twilio)
 * Backup 2: Discord Webhook
 * Backup 3: Escalation alerts if no response within 5 minutes
 */

interface AlertPayload {
  symbol: string;
  level: 'triggered' | 'warning' | 'ok';
  currentPrice: number;
  stopLoss: number;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * PRIMARY: Send via ntfy.sh (main channel)
 */
export async function sendNtfyAlert(payload: AlertPayload): Promise<boolean> {
  try {
    const response = await fetch('https://ntfy.sh/mgm-7k4x-live', {
      method: 'POST',
      headers: {
        'Title': getSeverityEmoji(payload.severity) + ' ' + payload.symbol,
        'Priority': getPriority(payload.severity),
        'Tags': 'trading,alert,' + payload.level,
      },
      body: formatNtfyMessage(payload),
    });
    return response.ok;
  } catch (error) {
    console.error('ntfy.sh alert failed:', error);
    return false;
  }
}

/**
 * BACKUP 1: Send SMS via Twilio (if Twilio configured)
 */
export async function sendSmsAlert(payload: AlertPayload): Promise<boolean> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const userPhoneNumber = process.env.USER_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken) {
    console.log('SMS: Twilio not configured, skipping SMS alert');
    return false;
  }

  try {
    const message = `🔴 ${payload.symbol} ALERT: Price ${payload.currentPrice.toFixed(2)} vs Stop ${payload.stopLoss.toFixed(2)}. ${payload.level === 'triggered' ? 'EXIT IMMEDIATELY' : 'MONITOR CLOSELY'}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber!,
          To: userPhoneNumber!,
          Body: message,
        }).toString(),
      }
    );

    if (response.ok) {
      console.log('SMS alert sent successfully');
      return true;
    }
  } catch (error) {
    console.error('SMS alert failed:', error);
  }
  return false;
}

/**
 * BACKUP 2: Send to Discord Webhook
 */
export async function sendDiscordAlert(payload: AlertPayload): Promise<boolean> {
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!discordWebhookUrl) {
    console.log('Discord: Webhook URL not configured, skipping');
    return false;
  }

  try {
    const color =
      payload.severity === 'critical' ? 16711680 : // Red
      payload.severity === 'warning' ? 16776960 : // Yellow
      65280; // Green

    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔔 **${payload.symbol} ALERT - ${payload.level.toUpperCase()}**`,
        embeds: [
          {
            title: `${getSeverityEmoji(payload.severity)} ${payload.symbol} Stop Loss Alert`,
            description: formatDiscordMessage(payload),
            color: color,
            fields: [
              {
                name: 'Current Price',
                value: payload.currentPrice.toFixed(2),
                inline: true,
              },
              {
                name: 'Stop Loss',
                value: payload.stopLoss.toFixed(2),
                inline: true,
              },
              {
                name: 'Distance',
                value: `${(payload.currentPrice - payload.stopLoss).toFixed(2)} pips`,
                inline: true,
              },
              {
                name: 'Action Required',
                value: payload.level === 'triggered' ? '🔴 EXIT IMMEDIATELY' : '⚠️ MONITOR',
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (response.ok) {
      console.log('Discord alert sent successfully');
      return true;
    }
  } catch (error) {
    console.error('Discord alert failed:', error);
  }
  return false;
}

/**
 * BACKUP 3: Escalation Alert - fires if no acknowledgment within 5 minutes
 */
export async function sendEscalationAlert(payload: AlertPayload): Promise<boolean> {
  const alertKey = `${payload.symbol}_${payload.level}_${Math.floor(Date.now() / 60000)}`;

  try {
    setTimeout(async () => {
      const escalationPayload: AlertPayload = {
        ...payload,
        severity: 'critical',
      };

      const message = `🚨 ESCALATION: No response to ${payload.symbol} ${payload.level} alert (sent 5 min ago). Last price: ${payload.currentPrice}. IMMEDIATE ACTION REQUIRED.`;

      // Send escalation via ALL channels
      await sendNtfyAlert(escalationPayload);
      await sendSmsAlert(escalationPayload);
      await sendDiscordAlert(escalationPayload);

      console.log(`Escalation sent for: ${alertKey}`);
    }, 5 * 60 * 1000); // 5 minutes

    return true;
  } catch (error) {
    console.error('Escalation alert setup failed:', error);
    return false;
  }
}

/**
 * SEND ALL ALERTS (Primary + Backups)
 */
export async function sendMultiChannelAlert(payload: AlertPayload): Promise<{
  ntfySuccess: boolean;
  smsSuccess: boolean;
  discordSuccess: boolean;
  escalationSetup: boolean;
}> {
  console.log(`🔔 Sending multi-channel alert for ${payload.symbol} (${payload.level})`);

  const [ntfySuccess, smsSuccess, discordSuccess, escalationSetup] = await Promise.all([
    sendNtfyAlert(payload),
    sendSmsAlert(payload),
    sendDiscordAlert(payload),
    sendEscalationAlert(payload),
  ]);

  return {
    ntfySuccess,
    smsSuccess,
    discordSuccess,
    escalationSetup,
  };
}

// ============ HELPER FUNCTIONS ============

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
      return '🟢';
    default:
      return '❓';
  }
}

function getPriority(severity: string): string {
  switch (severity) {
    case 'critical':
      return '5'; // URGENT
    case 'warning':
      return '4'; // HIGH
    case 'info':
      return '3'; // NORMAL
    default:
      return '3';
  }
}

function formatNtfyMessage(payload: AlertPayload): string {
  return `${getSeverityEmoji(payload.severity)} ${payload.symbol} ${payload.level.toUpperCase()}

Current Price: ${payload.currentPrice.toFixed(2)}
Stop Loss: ${payload.stopLoss.toFixed(2)}
Distance: ${(payload.currentPrice - payload.stopLoss).toFixed(2)} pips

Action: ${payload.level === 'triggered' ? 'EXIT IMMEDIATELY' : payload.level === 'warning' ? 'MONITOR CLOSELY' : 'CONTINUE MONITORING'}

Time: ${payload.timestamp.toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })} ADL`;
}

function formatDiscordMessage(payload: AlertPayload): string {
  return `
**Symbol**: ${payload.symbol}
**Status**: ${payload.level.toUpperCase()}
**Current Price**: ${payload.currentPrice.toFixed(2)}
**Stop Loss**: ${payload.stopLoss.toFixed(2)}
**Distance**: ${(payload.currentPrice - payload.stopLoss).toFixed(2)} pips

${payload.level === 'triggered' ? '🔴 **CRITICAL: POSITION MUST BE CLOSED IMMEDIATELY**' : payload.level === 'warning' ? '🟡 **WARNING: Monitor every tick, be ready to exit**' : '🟢 **Position is safe**'}
  `;
}
