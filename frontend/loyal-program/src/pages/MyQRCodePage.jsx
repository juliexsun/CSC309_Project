import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../hooks/useAuth';
import './MyQRCodePage.css';

const MyQRCodePage = () => {
  const { user } = useAuth();

  // Create QR code data
  const qrData = JSON.stringify({
    type: 'user',
    userId: user?.id,
    utorid: user?.utorid
  });

  return (
    <div className="page-container">
      <h1 className="page-title">My QR Code</h1>

      <div className="qr-content">
        <div className="qr-card">
          <div className="qr-header">
            <h2>Your Personal QR Code</h2>
            <p>Show this code to cashiers for quick transactions</p>
          </div>

          <div className="qr-code-container">
            <QRCodeSVG 
              value={qrData}
              size={300}
              level="H"
              includeMargin={true}
              className="qr-code"
            />
          </div>

          <div className="qr-info">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{user?.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">UTORid:</span>
              <span className="info-value">{user?.utorid}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID:</span>
              <span className="info-value">#{user?.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Current Points:</span>
              <span className="info-value points">{user?.points || 0}</span>
            </div>
          </div>

          <div className="qr-instructions">
            <h3>How to use:</h3>
            <ul>
              <li>Show this QR code to the cashier during checkout</li>
              <li>The cashier will scan it to process your transaction</li>
              <li>Points will be automatically added to your account</li>
              <li>You can also provide your User ID manually if needed</li>
            </ul>
          </div>
        </div>

        <div className="qr-tips">
          <h3>💡 Tips</h3>
          <div className="tip-item">
            <span className="tip-icon">🔒</span>
            <p>Keep your QR code private and only show it to authorized personnel</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">📱</span>
            <p>You can take a screenshot for offline access</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">✨</span>
            <p>Make sure the QR code is clearly visible when scanning</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyQRCodePage;
