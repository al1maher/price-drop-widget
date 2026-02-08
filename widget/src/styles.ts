export const styles = `
:host {
  font-family: inherit; 
  --pd-accent: #ffd814;
  --pd-bg: #fff;
  --pd-border: #e0e0e0;
  --pd-radius: 4px;
  display: block;
  width: 100%;
  margin: 0; 
  height: auto;
  min-height: 100%;
  box-sizing: border-box;
}

.pd-container {
  background: var(--pd-bg);
  border: 1px solid var(--pd-border);
  padding: 16px;
  border-radius: var(--pd-radius);
  box-shadow: none; 
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  box-sizing: border-box; 
  justify-content: center;
}

.pd-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.pd-form {
  display: flex;
  gap: 8px;
  width: 100%;
}

.pd-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.pd-input:focus {
  border-color: var(--pd-accent);
}

.pd-btn {
  background: var(--pd-accent);
  color: var(--pd-btn-text, #fff);
  border: none;
  padding: 0 16px;
  border-radius: var(--pd-radius);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  height: 36px; /* Align with input */
  align-self: center;
  font-family: inherit;
}

.pd-btn:hover {
  opacity: 0.9;
}

.pd-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pd-message {
  font-size: 13px;
  margin-top: 4px;
  display: none;
}

.pd-message.success {
  display: block;
  color: #28a745;
}

.pd-message.error {
  display: block;
  color: #d0021b;
}

/* Spinner */
.pd-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Shake animation for errors */
@keyframes pd-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.pd-shake {
  animation: pd-shake 0.5s ease-in-out;
}

/* Hidden form after success */
.pd-hidden {
  display: none;
}

@media (max-width: 480px) {
  .pd-form {
    flex-direction: column;
  }
  .pd-btn {
    width: 100%;
  }
}
`;
