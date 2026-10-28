import { initializeSlack, sendSlackMessage, sendSlackMessageToUser, checkSlackConnection, isSlackConfigured } from './slackIntegration.js';
import { sendTeamsMessage, sendTeamsMessageToUser, checkTeamsConnection, isTeamsConfigured } from './teamsIntegration.js';

export interface MessagingStatus {
  slack: {
    connected: boolean;
    enabled: boolean;
  };
  teams: {
    connected: boolean;
    enabled: boolean;
  };
}

class MessagingService {
  private slackEnabled = false;
  private teamsEnabled = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.slackEnabled = isSlackConfigured();
    this.teamsEnabled = isTeamsConfigured();
  }

  async getStatus(): Promise<MessagingStatus> {
    const [slackConnected, teamsConnected] = await Promise.all([
      this.slackEnabled ? checkSlackConnection() : false,
      this.teamsEnabled ? checkTeamsConnection() : false
    ]);

    return {
      slack: {
        connected: slackConnected,
        enabled: this.slackEnabled
      },
      teams: {
        connected: teamsConnected,
        enabled: this.teamsEnabled
      }
    };
  }

  async sendMessage(message: string, userEmail?: string): Promise<{ success: boolean; platform: string | null; error?: string }> {
    const status = await this.getStatus();

    // Try Teams first if available
    if (status.teams.connected) {
      try {
        const success = userEmail 
          ? await sendTeamsMessageToUser(message, userEmail)
          : await sendTeamsMessage(message);
        
        if (success) {
          return { success: true, platform: 'teams' };
        }
      } catch (error) {
        console.error('Teams messaging failed:', error);
      }
    }

    // Fall back to Slack if Teams is not available
    if (status.slack.connected) {
      try {
        const success = userEmail 
          ? await sendSlackMessageToUser(message, userEmail)
          : await sendSlackMessage(message);
        
        if (success) {
          return { success: true, platform: 'slack' };
        }
      } catch (error) {
        console.error('Slack messaging failed:', error);
      }
    }

    return { 
      success: false, 
      platform: null, 
      error: 'No messaging platforms available or configured' 
    };
  }

  async sendEmployeeMessage(employeeName: string, employeeEmail: string, managerName: string, message: string): Promise<{ success: boolean; platform: string | null; error?: string }> {
    const formattedMessage = `
📧 **Message from ${managerName}**

**To:** ${employeeName}
**Subject:** Manager Update

${message}

---
*Sent via CADET Employee Management System*
    `.trim();

    return await this.sendMessage(formattedMessage, employeeEmail);
  }
}

// Create singleton instance
export const messagingService = new MessagingService();