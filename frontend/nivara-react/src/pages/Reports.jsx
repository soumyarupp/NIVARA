import React from 'react';
import './Reports.css';
import HeaderNav from '../components/HeaderNav';
import Footer from '../components/Footer';
import ReportsView from '../components/ReportsView';

const Reports = () => {
  return (
    <>
      <HeaderNav activeKey="/reports" />

      {/* ===== Main Standalone Content ===== */}
      <main className="standalone-reports-page">
        <div className="page-title-banner">
          <h1>AI Predictive Risk &amp; Delay Reports</h1>
          <p>
            Pre-trained machine learning forecasting engine for Central Sector Mega Projects.
            Evaluates historical spend trajectory, contractor milestone slippage, and statutory clearance delays to forecast overruns before they occur.
          </p>
        </div>

        <ReportsView />
      </main>

      <Footer />
    </>
  );
};

export default Reports;
