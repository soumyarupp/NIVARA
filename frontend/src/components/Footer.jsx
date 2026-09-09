import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="site-footer">
    <p className="footer-copy">
      © Content Owned by Ministry of Statistics and Programme Implementation, Government of India.
      Developed by National Informatics Centre (NIC).
    </p>
    <div className="footer-links">
      <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Standard Government of India Open Data License."); }}>Terms of Service</a>
      <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: NIVARA Platform Data Privacy Protocol."); }}>Privacy Policy</a>
      <a href="#" onClick={(e) => { e.preventDefault(); alert("Helpdesk / Support: Contact support@nivara.gov.in"); }}>Helpdesk / Support</a>
      <Link to="/">Home</Link>
    </div>
  </footer>
);

export default Footer;
