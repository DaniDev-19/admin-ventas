import apiClient from './apiClient';

export interface CampaignPayload {
  clientIds: number[];
  subject: string;
  body: string;
}

export const emailService = {
  sendReceipt: async (to: string, details: any) => {
    const response = await apiClient.post('/emails/receipt', { to, details });
    return response.data;
  },

  sendCampaign: async (payload: CampaignPayload) => {
    const response = await apiClient.post('/emails/campaign', payload);
    return response.data;
  }
};

export default emailService;
