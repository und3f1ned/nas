interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const base = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 text-sm';
  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20',
    secondary: 'bg-bg-card hover:bg-bg-card-hover text-text-primary border border-border',
    ghost: 'bg-transparent hover:bg-bg-card text-text-secondary hover:text-text-primary',
  };
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:brightness-90';

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={`${base} ${variants[variant]} ${disabledClass} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
