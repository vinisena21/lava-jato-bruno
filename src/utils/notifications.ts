import { toast } from 'sonner';

export const notify = {
  // Substitutos para window.alert
  success: (mensagem: string) => toast.success(mensagem),
  error: (mensagem: string) => toast.error(mensagem),
  info: (mensagem: string) => toast.info(mensagem),
  warning: (mensagem: string) => toast.warning(mensagem),

  // Substituto para window.confirm
  confirm: (
    titulo: string,
    aoConfirmar: () => void,
    descricao: string = 'Esta ação não poderá ser desfeita.'
  ) => {
    toast(titulo, {
      description: descricao,
      duration: 6000,
      action: {
        label: 'Confirmar',
        onClick: aoConfirmar,
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => toast.dismiss(),
      },
    });
  },
};