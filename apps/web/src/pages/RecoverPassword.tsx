import { useState, useMemo, useRef } from 'react';
import { resetPasswordApi } from '../services/api';
import './RecoverPassword.css';


  

/* ─── SVG Icons ─── */

function IconEye() {

  return (

    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

      <circle cx="12" cy="12" r="3" />

    </svg>

  );

}

  

function IconEyeOff() {

  return (

    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />

      <line x1="1" y1="1" x2="23" y2="23" />

    </svg>

  );

}

  

export default function RecoverPassword({ onBackToLogin }: { onBackToLogin?: () => void }) {

  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  const [isLoading, setIsLoading] = useState(false);

  // Toast Notification State

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  

  const showToast = (message: string, type: 'success' | 'error') => {

    setToast({ message, type });

    if (toastTimer.current) clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => setToast(null), 4000);

  };

  // Phase 1 states

  const [identity, setIdentity] = useState('');

   // Phase 2 states (OTP)
  /*
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  */

  // Phase 3 states

  const [newPassword, setNewPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  

  // Validação de senha (Fase 3)

  const passwordStrength = useMemo(() => {

    if (!newPassword) return { score: 0, color: 'transparent', label: '' };

  

    let score = 0;

    if (newPassword.length >= 8) score++;

    if (/[A-Z]/.test(newPassword)) score++;

    if (/[a-z]/.test(newPassword)) score++;

    if (/[0-9]/.test(newPassword)) score++;

    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

  

    if (score <= 2) return { score, color: '#ef4444', label: 'Senha fraca' };

    if (score <= 4) return { score, color: '#f97316', label: 'Senha parcialmente boa' };

    return { score, color: '#22c55e', label: 'Senha ideal e aceita' };

  }, [newPassword]);

  

  const handleSendLink = (e: React.FormEvent) => {

    e.preventDefault();

    // Valida se há caracteres antes do @ e se termina exatamente em .com
    const isValidFormat = /^[^\s@]+@[^\s@]+\.com$/.test(identity);

    if (!isValidFormat) {

      showToast("E-mail inválido.", "error");

      return;

    }

  

    // Aciona a tela de loading para simular a ida ao banco

    setIsLoading(true);

    // Simula tempo de rede de 1.5 segundos

    setTimeout(() => {

      setIsLoading(false);

  

      // SIMULAÇÃO DE BANCO DE DADOS (Mock)
      showToast("E-mail confirmado. Redefina sua senha abaixo.", "success");

      showToast("Instruções de Recuperação Enviadas ao E-mail Informado", "success");
      setPhase(3); // Pula direto para a fase 3 para o teste

    }, 1500);

  };

  

  // OTP Handlers
  /*
  const handleCodeChange = (index: number, value: string) => {

    const newValue = value.replace(/\D/g, ''); // apenas números

  

    if (newValue.length > 1) {

      if (newValue.length === 2) {

        const lastChar = newValue[1];

        const newCode = [...code];

        newCode[index] = lastChar;

        setCode(newCode);

        if (index < 5) inputRefs.current[index + 1]?.focus();

        return;

      }

      const pastedCode = newValue.slice(0, 6).split('');

      const newCodeArray = [...code];

      pastedCode.forEach((char, i) => {

        if (index + i < 6) newCodeArray[index + i] = char;

      });

      setCode(newCodeArray);

      const nextIndex = Math.min(index + pastedCode.length, 5);

      inputRefs.current[nextIndex]?.focus();

      return;

    }

  

    const newCode = [...code];

    newCode[index] = newValue;

    setCode(newCode);

  

    if (newValue !== '' && index < 5) {

      inputRefs.current[index + 1]?.focus();

    }

  };

  

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {

    if (e.key === 'Backspace') {

      if (!code[index] && index > 0) {

        const newCode = [...code];

        newCode[index - 1] = '';

        setCode(newCode);

        inputRefs.current[index - 1]?.focus();

      } else {

        const newCode = [...code];

        newCode[index] = '';

        setCode(newCode);

      }

    } else if (e.key === 'ArrowLeft' && index > 0) {

      inputRefs.current[index - 1]?.focus();

    } else if (e.key === 'ArrowRight' && index < 5) {

      inputRefs.current[index + 1]?.focus();

    }

  };

  

  const handleValidateCode = (e: React.FormEvent) => {

    e.preventDefault();

    const finalCode = code.join('');

    if (finalCode.length === 6) {

      setIsLoading(true);

      setTimeout(() => {

        setIsLoading(false);

        if (finalCode === "123456") {

          setPhase(3);

        } else {

          showToast("Código de verificação incorreto ou expirado.", "error");

        }

      }, 1500);

    } else {

      showToast("O código deve ter 6 dígitos.", "error");

    }

  };
  */

  

  const handleResetPassword = (e: React.FormEvent) => {

    e.preventDefault();

    if (passwordStrength.score < 5) {

      showToast("Por favor, atenda a todos os requisitos de senha.", "error");

      return;

    }

    if (newPassword !== confirmPassword) {

      showToast("As senhas não coincidem.", "error");

      return;

    }

    setIsLoading(true);

    resetPasswordApi(identity, newPassword)
      .then(() => {
        setIsLoading(false);
        showToast("Senha alterada com sucesso no banco de dados!", "success");
        setTimeout(() => {
          if (onBackToLogin) onBackToLogin();
        }, 1200);
      })
      .catch((err) => {
        setIsLoading(false);
        showToast(err.message || "Erro ao alterar senha.", "error");
      });

  };

  

  // Funções auxiliares para os títulos dinâmicos de cada fase

  const getHeaderTitle = () => {

    if (phase === 1) return "Recuperação de Senha";

    if (phase === 2) return "Validar Código";

    return "Nova Senha";

  };

  

  const getHeaderSubtitle = () => {

    if (phase === 1) return "Informe seu e-mail para receber o código de verificação.";

    if (phase === 2) return "Insira o código de 6 dígitos que enviamos para o seu e-mail.";

    return "Crie uma nova senha segura para sua conta.";

  };

  

  return (

    <div className="recovery-container">

      <div className="recovery-card">

        <div className="recovery-header">

          <h2 className="recovery-title">{getHeaderTitle()}</h2>

          <p className="recovery-subtitle">{getHeaderSubtitle()}</p>

        </div>

  

        {isLoading ? (

          <div className="loading-container">

            <div className="spinner"></div>

            <p>Processando, aguarde...</p>

          </div>

        ) : (

          <>

            {phase === 1 && (

              <form onSubmit={handleSendLink} className="recovery-form" noValidate>

                <div className="form-group">

                  <label htmlFor="identity">E-mail</label>

                  <input

                    id="identity"

                    type="email"

                    placeholder="Ex: usuario@email.com"

                    value={identity}

                    onChange={(e) => setIdentity(e.target.value)}

                    required

                  />

                </div>

  

                <button type="submit" className="btn-primary">

                  Enviar link

                </button>

                {onBackToLogin && (

                  <button type="button" className="btn-secondary" onClick={onBackToLogin}>

                    Voltar

                  </button>

                )}

              </form>
            )}

            {/* CÓDIGO DE E-MAIL (FASE 2) - COMENTADO PARA A APRESENTAÇÃO
            {phase === 2 && (
              <form onSubmit={handleValidateCode} className="recovery-form" noValidate>
                <div className="form-group">
                  <label>Código de 6 dígitos</label>
                  <div className="otp-container">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        required
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={code.join('').length !== 6}
                >
                  Validar código
                </button>

                <button type="button" className="btn-secondary" onClick={() => setPhase(1)}>
                  Voltar
                </button>
              </form>
            )}
            */}
  

        {phase === 3 && (

          <form onSubmit={handleResetPassword} className="recovery-form">

            <div className="form-group">

              <label htmlFor="newPassword">Nova Senha</label>

              <div className="input-wrapper">

                <input

                  id="newPassword"

                  type={showPassword ? "text" : "password"}

                  placeholder="Digite sua nova senha"

                  value={newPassword}

                  onChange={(e) => setNewPassword(e.target.value)}

                  required

                />

                <button

                  type="button"

                  className="btn-toggle-password"

                  onClick={() => setShowPassword(!showPassword)}

                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}

                >

                  {showPassword ? <IconEyeOff /> : <IconEye />}

                </button>

              </div>

              {newPassword && (

                <div className="password-strength-container">

                  <div className="strength-bar-bg">

                    <div

                      className="strength-bar-fill"

                      style={{

                        width: `${(passwordStrength.score / 5) * 100}%`,

                        backgroundColor: passwordStrength.color

                      }}

                    />

                  </div>

                  <span className="strength-label" style={{ color: passwordStrength.color }}>

                    {passwordStrength.label}

                  </span>

                </div>

              )}

              <ul className="password-requirements">

                <li className={newPassword.length >= 8 ? 'met' : ''}>Mínimo de 8 caracteres</li>

                <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>Uma letra maiúscula</li>

                <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>Uma letra minúscula</li>

                <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>Um número</li>

                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}>Um caractere especial</li>

              </ul>

            </div>

  

            <div className="form-group">

              <label htmlFor="confirmPassword">Redefinir Senha</label>

              <div className="input-wrapper">

                <input

                  id="confirmPassword"

                  type={showConfirmPassword ? "text" : "password"}

                  placeholder="Repita sua nova senha"

                  value={confirmPassword}

                  onChange={(e) => setConfirmPassword(e.target.value)}

                  onPaste={(e) => {

                    e.preventDefault();

                    showToast("Por favor, digite a senha manualmente.", "error");

                  }}

                  required

                />

                <button

                  type="button"

                  className="btn-toggle-password"

                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}

                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}

                >

                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}

                </button>

              </div>

            </div>

  

            <button

              type="submit"

              className="btn-primary"

            >

              Redefinir Senha

            </button>

  

            <button type="button" className="btn-secondary" onClick={() => setPhase(1)}>

              Voltar

            </button>

          </form>

        )}

          </>

        )}

      </div>

  

      {/* TOAST NOTIFICATION */}

      {toast && (

        <div className={`toast-notification toast-${toast.type}`}>

          {toast.message}

        </div>

      )}

    </div>

  );

}