import { sendInvitationEmail } from '../src/services/email.service.js';

const runTest = async () => {
  try {
    console.log('\n📨 Sending a real test invitation email to your Gmail...');
    
    const result = await sendInvitationEmail({
      to: 'soumyarup30@gmail.com',
      fullName: 'Soumyarup Samanta',
      role: 'IPMD_ADMIN',
      organizationName: 'National Infrastructure Authority (NIVARA)',
      rawToken: 'test-demo-activation-token-123456'
    });

    console.log('✅ Email sent successfully!');
    console.log('Response Message ID:', result.messageId || 'Delivered');
    console.log('\n👉 Open your Gmail inbox (or check spam folder) to see the NIVARA email!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    process.exit(1);
  }
};

runTest();
