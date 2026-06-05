import { api } from '@/shared/api/api';
import { useMutation } from '@tanstack/react-query';

type UploadResponse = { url: string };

export const useUploadFile = () => {
  return useMutation<UploadResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<UploadResponse>('/upload', formData);

      return response;
    },
  });
};
