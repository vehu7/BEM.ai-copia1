/**
 * Lasy Error Handler - Captura erros e comunica com o iframe pai
 * 
 * Este script deve ser carregado no <head> antes de qualquer outro script
 * para capturar erros de módulos, build e runtime.
 * 
 * Tipos de mensagens enviadas via postMessage:
 * - { type: 'copy-error', text: string } - Erro de runtime/build
 * - { type: 'invalid-token', code: 'INVALID_TOKEN', text: string } - URL expirada
 * 
 * Features:
 * - Grace period de 3s no startup (ignora erros durante carregamento inicial)
 * - Debounce de 1.5s para acumular erros antes de enviar
 * - Máximo de 5 erros reportados por sessão
 */
(function() {
  // Configurações
  var STARTUP_GRACE_PERIOD = 3000; // 3 segundos para app carregar
  var ERROR_DEBOUNCE_TIME = 1500;  // 1.5 segundos para acumular erros
  var MAX_ERRORS = 5;

  // Estado
  var startTime = Date.now();
  var errorCount = 0;
  var reportedErrors = new Set();
  var pendingErrors = [];
  var debounceTimer = null;
  var isInGracePeriod = true;

  // Sair do grace period após timeout
  setTimeout(function() {
    isInGracePeriod = false;
    console.log('[lasy] Grace period ended, error reporting enabled');
  }, STARTUP_GRACE_PERIOD);

  // Detectar se erro é crítico (NUNCA ignorar, mesmo em grace period)
  function isCriticalError(message, filename) {
    var lowerMsg = (message || '').toLowerCase();
    var lowerFile = (filename || '').toLowerCase();
    
    // ✅ NOVO: Erros de Supabase/Variáveis de Ambiente (sempre críticos)
    // Detecta tanto mensagens customizadas quanto erros de variáveis não definidas
    if (lowerMsg.includes('variáveis do supabase') ||
        lowerMsg.includes('variáveis supabase') ||
        (lowerMsg.includes('supabase') && (lowerMsg.includes('não encontrad') || lowerMsg.includes('missing') || lowerMsg.includes('undefined') || lowerMsg.includes('not defined'))) ||
        lowerMsg.includes('supabase_url') ||
        lowerMsg.includes('supabase_anon_key') ||
        lowerMsg.includes('vite_supabase') ||
        lowerMsg.includes('next_public_supabase') ||
        ((lowerMsg.includes('process.env') || lowerMsg.includes('import.meta.env')) && (lowerMsg.includes('undefined') || lowerMsg.includes('not defined')))) {
      return true;
    }
    
    // HTTP 500 ou 504 são sempre críticos (erro de servidor/gateway timeout)
    if (lowerMsg.includes('500') || lowerMsg.includes('504') ||
        lowerMsg.includes('internal server error') || lowerMsg.includes('gateway timeout')) {
      return true;
    }

    // Erros em dependências críticas do Vite (node_modules servidos)
    if (lowerFile.includes('react.js') || lowerFile.includes('react-dom') ||
        lowerFile.includes('_jsx-dev-runtime') || lowerFile.includes('index.css') ||
        lowerFile.includes('node_modules/')) {
      return true;
    }
    
    // Falha ao carregar entrada do app (main.tsx, main.js, index.tsx)
    if (lowerFile.includes('/main.tsx') || lowerFile.includes('/main.js') || 
        lowerFile.includes('/index.tsx') || lowerFile.includes('/index.js') ||
        lowerFile.includes('main.tsx') || lowerFile.includes('main.js')) {
      return true;
    }
    
    // Build failed
    if (lowerMsg.includes('build failed') || lowerMsg.includes('compilation failed')) {
      return true;
    }
    
    // SyntaxError em qualquer módulo
    if (lowerMsg.includes('syntaxerror')) {
      return true;
    }
    
    // Module not found
    if (lowerMsg.includes('module not found') || lowerMsg.includes('cannot find module')) {
      return true;
    }
    
    // Erros de carregamento de recursos críticos
    if (lowerMsg.includes('failed to fetch') && lowerFile.includes('.tsx')) {
      return true;
    }
    
    return false;
  }

  // Função para enviar erros acumulados para o pai
  function flushErrorsToParent() {
    if (window.parent === window) return;
    if (pendingErrors.length === 0) return;

    // Pegar o erro mais relevante (primeiro crítico ou primeiro da lista)
    var errorToSend = pendingErrors.find(function(e) {
      var msg = e.toLowerCase();
      return msg.includes('typeerror') || msg.includes('referenceerror') || 
             msg.includes('syntaxerror') || msg.includes('build failed');
    }) || pendingErrors[0];

    // Evitar duplicatas
    var errorKey = errorToSend.substring(0, 100);
    if (reportedErrors.has(errorKey)) {
      pendingErrors = [];
      return;
    }
    
    reportedErrors.add(errorKey);
    errorCount++;

    window.parent.postMessage({
      type: 'copy-error',
      text: errorToSend
    }, '*');

    console.log('[lasy] Error reported to parent after debounce');
    pendingErrors = [];
  }

  // Função para adicionar erro à fila (com debounce)
  function queueError(errorText, filename, message) {
    if (window.parent === window) return;
    if (errorCount >= MAX_ERRORS) return;
    
    // NOVO: Verificar se erro é crítico
    var isCritical = isCriticalError(message || errorText, filename || '');
    
    // Grace period: ignorar APENAS erros não-críticos
    if (!isCritical && isInGracePeriod) {
      console.log('[lasy] Error ignored (grace period):', errorText.substring(0, 50));
      return;
    }
    
    // Se é crítico durante grace period, reportar IMEDIATAMENTE
    if (isCritical && isInGracePeriod) {
      console.warn('[lasy] ⚠️ CRITICAL error during grace period, reporting immediately!');
    }

    // Evitar duplicatas na fila
    var errorKey = errorText.substring(0, 100);
    if (pendingErrors.some(function(e) { return e.substring(0, 100) === errorKey; })) {
      return;
    }

    pendingErrors.push(errorText);

    // Para erros críticos, reduzir debounce para 500ms (mais rápido)
    var debounceTime = isCritical ? 500 : ERROR_DEBOUNCE_TIME;
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(flushErrorsToParent, debounceTime);
  }

  // Detectar se é erro específico de dependências do Vite (504/500 em módulos React)
  function isDependencyError(message, filename) {
    var lowerMsg = (message || '').toLowerCase();
    var lowerFile = (filename || '').toLowerCase();

    // Padrão: erro de carregamento (504/500) em arquivos de dependências
    var isLoadError = lowerMsg.includes('failed to load') ||
                      lowerMsg.includes('falha ao carregar') ||
                      lowerMsg.includes('504') ||
                      lowerMsg.includes('500');

    var isDependencyFile = lowerFile.includes('react') ||
                           lowerFile.includes('_jsx') ||
                           lowerFile.includes('node_modules') ||
                           (lowerFile.includes('.css') && lowerMsg.includes('500'));

    return isLoadError && isDependencyFile;
  }

  // Função legacy para compatibilidade (envia imediatamente - usado para INVALID_TOKEN)
  function sendErrorToParent(errorText, errorType, filename, message) {
    if (window.parent === window) return;

    // INVALID_TOKEN sempre envia imediatamente (não é erro de app)
    if (errorType === 'invalid-token') {
      window.parent.postMessage({
        type: errorType,
        text: errorText
      }, '*');
      return;
    }

    // ✅ NOVO: Detectar erro de dependências e enviar tipo específico
    if (isDependencyError(message, filename)) {
      window.parent.postMessage({
        type: 'dependency-error',
        text: 'Erro de dependências detectado. As bibliotecas do projeto não foram instaladas corretamente.'
      }, '*');
      console.warn('[lasy] Dependency error detected, notified parent');
      return;
    }

    // Outros erros vão para a fila com debounce
    queueError(errorText, filename, message);
  }

  // Detectar INVALID_TOKEN no body (quando Worker retorna JSON de erro)
  function checkForInvalidToken() {
    try {
      var bodyText = document.body?.innerText || document.body?.textContent || '';
      if (bodyText.includes('INVALID_TOKEN') || bodyText.includes('Access denied')) {
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'invalid-token',
            code: 'INVALID_TOKEN',
            text: bodyText
          }, '*');
        }
        console.log('[lasy] INVALID_TOKEN detected, notified parent');
        return true;
      }
    } catch(e) {}
    return false;
  }

  // Verificar assim que possível
  if (document.body) {
    checkForInvalidToken();
  }

  // Verificar novamente após DOM carregar (fallback)
  document.addEventListener('DOMContentLoaded', function() {
    checkForInvalidToken();
  });

  // Captura erros globais (incluindo module loading errors)
  window.addEventListener('error', function(event) {
    // Construir mensagem de erro mais robusta
    var message = event.message || '';
    var filename = event.filename || '';
    var lineno = event.lineno || '?';
    var colno = event.colno || '?';
    var stack = event.error?.stack || '';

    // Se message é vazio/undefined, tentar extrair do target (erro de recurso)
    if (!message && event.target) {
      var target = event.target;
      if (target.tagName === 'SCRIPT') {
        message = 'Falha ao carregar script: ' + (target.src || 'inline');
        filename = target.src || filename;
      } else if (target.tagName === 'LINK') {
        message = 'Falha ao carregar CSS: ' + (target.href || 'unknown');
        filename = target.href || filename;
      } else if (target.tagName === 'IMG') {
        message = 'Falha ao carregar imagem: ' + (target.src || 'unknown');
        filename = target.src || filename;
      } else {
        message = 'Erro de recurso: ' + (target.tagName || 'unknown');
      }
    }

    // Se ainda não tem mensagem, usar fallback genérico
    if (!message) {
      message = 'Erro desconhecido no carregamento da aplicação';
    }

    var errorText = 'Esse erro de preview foi gerado, revise e corrija:\n\n' +
      message + '\n\n' +
      'Arquivo: ' + (filename || 'Desconhecido') + ':' + lineno + ':' + colno + '\n\n' +
      'Stack:\n' + (stack || 'N/A');

    sendErrorToParent(errorText, 'copy-error', filename, message);

    console.error('[lasy] Global error caught:', {
      message: message,
      filename: filename,
      lineno: lineno,
      colno: colno,
      error: event.error
    });
  }, true); // true = capture phase (pega ANTES de outros handlers)

  // Captura promises rejeitadas sem catch (inclui import() dinâmico que falha)
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var message = '';
    var stack = '';

    // Extrair informações do erro
    if (reason) {
      if (typeof reason === 'string') {
        message = reason;
      } else if (reason.message) {
        message = reason.message;
        stack = reason.stack || '';
      } else {
        message = reason.toString();
      }
    } else {
      message = 'Promise rejeitada sem motivo';
    }

    // Detectar erros de fetch/import (HTTP 500, etc)
    if (message.includes('500') || message.includes('Failed to fetch') || 
        message.includes('ERR_ABORTED') || message.includes('NetworkError')) {
      message = 'Erro de build/rede: ' + message;
    }

    var errorText = 'Esse erro de preview foi gerado, revise e corrija:\n\n' +
      'Promise rejeitada:\n' + message + '\n\n' +
      'Stack:\n' + (stack || 'N/A');

    sendErrorToParent(errorText, 'copy-error', '', message);

    console.error('[lasy] Unhandled rejection:', reason);
  });

  // Interceptar console.error para capturar erros de bibliotecas
  var originalConsoleError = console.error;
  console.error = function() {
    // Chamar original
    originalConsoleError.apply(console, arguments);

    // Converter argumentos para string
    var args = Array.prototype.slice.call(arguments);
    var message = args.map(function(arg) {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch(e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');

    // Filtrar apenas erros relevantes (não warnings do Vite HMR)
    var lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('error') || lowerMsg.includes('failed') || 
        lowerMsg.includes('500') || lowerMsg.includes('err_aborted') ||
        lowerMsg.includes('uncaught') || lowerMsg.includes('typeerror') ||
        lowerMsg.includes('referenceerror') || lowerMsg.includes('syntaxerror')) {
      
      // Ignorar alguns erros conhecidos não críticos
      if (lowerMsg.includes('[vite] connecting') || 
          lowerMsg.includes('websocket') ||
          lowerMsg.includes('hmr')) {
        return;
      }

      var errorText = 'Erro capturado no console:\n\n' + message;
      sendErrorToParent(errorText, 'copy-error', '', message);
    }
  };

  // ✅ NOVO: Notificar parent quando app carrega com sucesso (sem erros)
  // Isso permite que o overlay de erro seja limpo automaticamente após correção
  window.addEventListener('load', function() {
    // Aguarda após grace period para ter certeza que não há erros pendentes
    setTimeout(function() {
      // Se não reportou nenhum erro, app carregou com sucesso
      if (errorCount === 0 && pendingErrors.length === 0) {
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'lasy-app-loaded' }, '*');
          console.log('[lasy] App loaded successfully, notified parent');
        }
      }
    }, STARTUP_GRACE_PERIOD + 500); // grace period + buffer (3.5s total)
  });
})();

