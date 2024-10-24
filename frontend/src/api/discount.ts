import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const fetchDiscountRules = async () => {
  const response = await api.get('/discount-rules');
  return response.data;
};

export const createDiscountRule = async (data: any) => {
  const response = await api.post('/discount-rules', data);
  return response.data;
};

export const updateDiscountRule = async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/discount-rules/${id}`, data);
  return response.data;
};

export const deleteDiscountRule = async (id: string) => {
  await api.delete(`/discount-rules/${id}`);
};

export const calculateDiscount = async ({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) => {
  const response = await api.get(`/discount-rules/calculate/${productId}/${quantity}`);
  return response.data;
};
