import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Instância base com o padrão visual do Cronos
export const cronosSwal = Swal.mixin({
  buttonsStyling: true,
  customClass: {
    popup: 'cronos-swal-popup',
    title: 'cronos-swal-title',
    htmlContainer: 'cronos-swal-text',
    confirmButton: 'cronos-swal-confirm-btn',
    cancelButton: 'cronos-swal-cancel-btn',
  },
});

/**
 * Diálogo profissional de confirmação com SweetAlert2
 */
export async function confirmAction(options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: 'warning' | 'question' | 'info' | 'error';
  isDestructive?: boolean;
}): Promise<boolean> {
  const result = await cronosSwal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon ?? (options.isDestructive ? 'warning' : 'question'),
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? (options.isDestructive ? 'Sim, confirmar' : 'Confirmar'),
    cancelButtonText: options.cancelText ?? 'Cancelar',
    confirmButtonColor: options.isDestructive ? '#dc2626' : '#5b21b6',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
    focusCancel: options.isDestructive,
  });

  return result.isConfirmed;
}

/**
 * Mensagem de Sucesso
 */
export function showSuccess(title: string, text?: string) {
  return cronosSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#16a34a',
    timer: 3500,
    timerProgressBar: true,
  });
}

/**
 * Mensagem de Erro
 */
export function showError(title: string, text?: string) {
  return cronosSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#dc2626',
  });
}

/**
 * Mensagem de Aviso / Alerta
 */
export function showWarning(title: string, text?: string) {
  return cronosSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#d97706',
  });
}

/**
 * Notificação tipo Toast no canto superior
 */
export function showToast(title: string, icon: 'success' | 'info' | 'warning' | 'error' = 'success') {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  return Toast.fire({
    icon,
    title,
  });
}

export default cronosSwal;
