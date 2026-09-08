import {
  loginUser,
  activateUserAccount,
  refreshSession,
  logoutSession,
  requestPasswordReset,
  resetUserPassword
} from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { parseDurationToMs } from '../utils/token.js';
import { env } from '../config/env.js';

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] || null
});

const getCookieOptions = () => {
  const maxAge = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
    path: '/api/auth'
  };
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { officialEmail, password } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await loginUser({ officialEmail, password, ipAddress, userAgent });

    // Set secure HTTP-only refresh token cookie
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    return sendSuccess(
      res,
      'Login successful',
      {
        user: result.user,
        accessToken: result.accessToken
      },
      200
    );
  } catch (error) {
    return sendError(res, error.message, [], 401);
  }
};

/**
 * GET /api/auth/verify-invite?token=...
 */
export const verifyInvite = async (req, res, next) => {
  try {
    const token = req.query.token || req.params.token;
    const result = await verifyInvitationToken(token);
    return sendSuccess(res, 'Invitation token is valid', result, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * GET /api/auth/activate?token=... (Browser Activation Page)
 */
export const getActivationPage = async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).send('<h2>Invalid Link</h2><p>Activation token is missing.</p>');
    }

    const info = await verifyInvitationToken(token);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NIVARA Account Activation</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: #1e293b; border-radius: 12px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border: 1px solid #334155; }
          .logo { text-align: center; margin-bottom: 24px; }
          .logo h1 { margin: 0; font-size: 26px; color: #38bdf8; letter-spacing: 1px; }
          .logo p { margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; }
          .user-badge { background: #0f172a; padding: 14px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #38bdf8; }
          .user-badge p { margin: 4px 0; font-size: 14px; color: #cbd5e1; }
          .form-group { margin-bottom: 18px; }
          label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
          input { width: 100%; padding: 12px 14px; background: #0f172a; border: 1px solid #475569; border-radius: 6px; color: #fff; font-size: 15px; outline: none; }
          input:focus { border-color: #38bdf8; ring: 2px solid rgba(56,189,248,0.2); }
          .btn { width: 100%; padding: 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 15px; cursor: pointer; margin-top: 10px; transition: background 0.2s; }
          .btn:hover { background: #1d4ed8; }
          .alert { padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; display: none; }
          .alert-error { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; }
          .alert-success { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #86efac; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <h1>NIVARA</h1>
            <p>Official Account Activation</p>
          </div>

          <div class="user-badge">
            <p><strong>Official:</strong> ${info.fullName}</p>
            <p><strong>Email:</strong> ${info.officialEmail}</p>
            <p><strong>Assigned Role:</strong> ${info.role}</p>
            <p><strong>Organization:</strong> ${info.organizationName}</p>
          </div>

          <div id="alertBox" class="alert"></div>

          <form id="activationForm">
            <input type="hidden" id="token" value="${token}">
            
            <div class="form-group">
              <label for="password">Create Secret Password</label>
              <input type="password" id="password" required placeholder="Min 8 characters (Uppercase, Number, Symbol)">
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" required placeholder="Re-enter password">
            </div>

            <button type="submit" class="btn" id="submitBtn">Activate Account & Set Password</button>
          </form>
        </div>

        <script>
          const form = document.getElementById('activationForm');
          const alertBox = document.getElementById('alertBox');
          const submitBtn = document.getElementById('submitBtn');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('token').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            alertBox.style.display = 'none';

            if (password !== confirmPassword) {
              alertBox.className = 'alert alert-error';
              alertBox.innerText = 'Passwords do not match.';
              alertBox.style.display = 'block';
              return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Activating Account...';

            try {
              const res = await fetch('/api/auth/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword })
              });
              const data = await res.json();

              if (data.success) {
                form.style.display = 'none';
                alertBox.className = 'alert alert-success';
                alertBox.innerHTML = '<h3>🎉 Account Activated!</h3><p>Your password has been set. You can now log in to the NIVARA platform.</p>';
                alertBox.style.display = 'block';
              } else {
                alertBox.className = 'alert alert-error';
                alertBox.innerText = data.message || 'Activation failed.';
                alertBox.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerText = 'Activate Account & Set Password';
              }
            } catch (err) {
              alertBox.className = 'alert alert-error';
              alertBox.innerText = 'Network error. Please try again.';
              alertBox.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.innerText = 'Activate Account & Set Password';
            }
          });
        </script>
      </body>
      </html>
    `;

    return res.send(html);
  } catch (error) {
    return res.status(400).send(`<h2>Activation Error</h2><p>${error.message}</p>`);
  }
};

/**
 * POST /api/auth/activate
 */
export const activate = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await activateUserAccount({ token, password, ipAddress, userAgent });

    return sendSuccess(
      res,
      'Account activated successfully. You can now login with your credentials.',
      result,
      200
    );
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const { ipAddress, userAgent } = getClientInfo(req);

    if (!refreshToken) {
      return sendError(res, 'Refresh token not found. Please login again.', [], 401);
    }

    const result = await refreshSession({ refreshToken, ipAddress, userAgent });

    // Rotate refresh token cookie
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    return sendSuccess(
      res,
      'Token refreshed successfully',
      {
        accessToken: result.accessToken
      },
      200
    );
  } catch (error) {
    // Clear invalid cookie on failure
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendError(res, error.message, [], 401);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?.userId || null;
    const { ipAddress, userAgent } = getClientInfo(req);

    await logoutSession({ refreshToken, userId, ipAddress, userAgent });

    res.clearCookie('refreshToken', { path: '/api/auth' });

    return sendSuccess(res, 'Logged out successfully', {}, 200);
  } catch (error) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendSuccess(res, 'Logged out successfully', {}, 200);
  }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { officialEmail } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const message = await requestPasswordReset({ officialEmail, ipAddress, userAgent });

    return sendSuccess(res, message, {}, 200);
  } catch (error) {
    return sendSuccess(res, 'If the account exists, a password reset link has been sent.', {}, 200);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const message = await resetUserPassword({ token, password, ipAddress, userAgent });

    res.clearCookie('refreshToken', { path: '/api/auth' });

    return sendSuccess(res, message, {}, 200);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 'User profile retrieved successfully', { user: req.user }, 200);
  } catch (error) {
    next(error);
  }
};
