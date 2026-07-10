import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm', message, confirmText = 'Delete', danger = true }) {
  if (!isOpen) return null;

  const titleId = 'confirm-dialog-title';
  const messageId = 'confirm-dialog-message';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" role="alertdialog" aria-labelledby={titleId} aria-describedby={messageId}>
      <p id={messageId} className="text-sm text-purple-700 dark:text-purple-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
          Cancel
        </button>
        <button onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
            danger
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
