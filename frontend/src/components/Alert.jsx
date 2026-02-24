import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Alert = ({ type = 'info', message, onClose = null }) => {
    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`alert alert-${type}`} style={{ marginBottom: '1rem' }}>
            <span>{icons[type]}</span>
            <span style={{ flex: 1 }}>{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'inherit'
                    }}
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );
};