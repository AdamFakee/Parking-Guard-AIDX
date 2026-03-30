import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addStaff, deleteStaff, restoreStaff, updateStaff } from '../apis/staff.api';

import { toastQueue } from '@/shared/utils/toast.util';

interface UseStaffMutationProps {
    onSuccess?: () => void;
}

export const useStaffMutation = ({ onSuccess }: UseStaffMutationProps = {}) => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: addStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all staffs'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toastQueue.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể thêm nhân viên',
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all staffs'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toastQueue.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể cập nhật nhân viên',
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all staffs'] });
    },
    onError: (error: any) => {
      toastQueue.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể xóa nhân viên',
      });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: restoreStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all staffs'] });
    },
    onError: (error: any) => {
      toastQueue.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể khôi phục nhân viên',
      });
    }
  });

  return {
    addMutation,
    updateMutation,
    deleteMutation,
    restoreMutation
  };
};
