import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, roleName, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '20px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444'
        }}>
          <ShieldAlert size={36} />
        </div>

        <span style={{
          display: 'inline-block',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 12px',
          borderRadius: '9999px',
          marginBottom: '12px'
        }}>
          403 Access Restricted
        </span>

        <h1 style={{
          fontSize: '22px',
          fontWeight: '800',
          color: '#ffffff',
          marginBottom: '8px'
        }}>
          Unauthorized Security Level
        </h1>

        <p style={{
          fontSize: '13.5px',
          color: '#9ca3af',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          Your current account role <strong style={{ color: '#38bdf8' }}>({roleName})</strong> does not possess clearance for this ministerial or administrative workspace module.
        </p>

        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '28px',
          textAlign: 'left',
          fontSize: '12.5px',
          color: '#cbd5e1'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Authenticated User:</span>
            <strong style={{ color: '#ffffff' }}>{user?.fullName || user?.officialEmail || 'Officer'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Designated Role:</span>
            <span style={{ color: '#38bdf8', fontWeight: '700' }}>{roleName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <Home size={16} /> Return to Dashboard
          </Link>

          <button
            type="button"
            onClick={logout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
