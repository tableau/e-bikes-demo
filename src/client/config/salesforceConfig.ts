import { AgentContextType } from '@salesforce/analytics-embedding-sdk';

/**
 * Salesforce Analytics Agent Configuration
 * 
 * Update these values with your actual Salesforce Analytics Agent details:
 * 
 * - agentId: The Analytics Agent ID or API name from Salesforce
 * - contextType: The type of asset (SDM, DASHBOARD, or METRIC)
 * - contextTypeIdOrApiName: The ID or API name of the SDM/Dashboard/Metric
 * - showHeader: Whether to show the agent header
 * - showHeaderActions: Whether to show header actions
 */
export const salesforceAgentConfig = {
  agentId: '0XxWs000000lj3JKAQ', // Replace with your Analytics Agent ID
  contextType: AgentContextType.SDM, // Options: AgentContextType.SDM, AgentContextType.DASHBOARD, AgentContextType.METRIC
  contextTypeIdOrApiName: 'eBikes_Inventory_and_Sales', // Replace with your SDM/Dashboard/Metric ID
  showHeader: true,
  showHeaderActions: true,
};

