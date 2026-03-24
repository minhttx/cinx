Tôi sẽ hướng dẫn bạn cách truy cập camera trong PWA trên Android và iOS để quét mã QR. Đây là một trong những thách thức phổ biến vì các hạn chế bảo mật của trình duyệt di động.

## 📱 Vấn đề chính với Camera trên PWA Di động

### iOS Safari (WebKit) - Giới hạn nghiêm ngặt:
- Không hỗ trợ `getUserMedia()` cho camera trong PWA standalone mode trước iOS 16.4
- Từ iOS 16.4+, camera được hỗ trợ nhưng cần HTTPS + user gesture
- Không thể tự động bật camera, phải có tương tác người dùng

### Android Chrome:
- Hỗ trợ tốt hơn nhưng vẫn cần HTTPS và permissions

---

## 🔧 Giải pháp 1: Sử dụng HTML5 QR Code Scanner (Khuyến nghị)

Đây là thư viện phổ biến nhất, hoạt động tốt trên cả Android và iOS:

### 1. Cài đặt thư viện

```bash
npm install html5-qrcode
```

### 2. Component QR Scanner React

```tsx
// components/QRScanner.tsx
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách camera khi component mount
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Yêu cầu quyền camera trước
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          // Ưu tiên camera sau (back camera) cho mobile
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        }
      } catch (err) {
        console.error('Lỗi lấy camera:', err);
        onError?.('Không thể truy cập camera. Vui lòng cấp quyền camera.');
      }
    };

    getCameras();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera || !containerRef.current) return;

    try {
      setIsScanning(true);
      
      scannerRef.current = new Html5Qrcode('qr-reader');
      
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Thành công quét được
          onScan(decodedText);
          // Tùy chọn: dừng quét sau khi thành công
          // stopScanning();
        },
        (errorMessage) => {
          // Lỗi quét (bỏ qua các lỗi nhỏ khi chưa có QR)
          // console.log(errorMessage);
        }
      );
    } catch (err) {
      console.error('Lỗi bắt đầu quét:', err);
      setIsScanning(false);
      onError?.('Không thể khởi động scanner');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Lỗi dừng scanner:', err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  return (
    <div className="qr-scanner-container">
      {/* Chọn camera */}
      <div className="camera-select mb-4">
        <select 
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={isScanning}
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Camera ${camera.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Nút điều khiển */}
      <div className="controls mb-4 flex gap-2">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={!selectedCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            📷 Bắt đầu quét
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            ⏹️ Dừng quét
          </button>
        )}
      </div>

      {/* Container cho video */}
      <div 
        id="qr-reader" 
        ref={containerRef}
        className="w-full max-w-md mx-auto"
        style={{ minHeight: '300px' }}
      />

      {/* Hướng dẫn */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        <p>Đặt mã QR vào giữa khung hình</p>
        <p className="mt-1">📱 iOS: Nhấn "Bắt đầu quét" để cấp quyền camera</p>
      </div>
    </div>
  );
}
```

### 3. Trang Check-in sử dụng Supabase

```tsx
// pages/CheckIn.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import QRScanner from '../components/QRScanner';

export default function CheckIn() {
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleScan = async (qrData: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      // Parse QR data (giả sử QR chứa ticket_id hoặc JSON)
      let ticketId = qrData;
      try {
        const parsed = JSON.parse(qrData);
        ticketId = parsed.ticket_id || qrData;
      } catch {
        // QR là plain text (ticket_id)
      }

      // Query Supabase
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          showtimes (
            *,
            movies (title)
          ),
          seats (row, number)
        `)
        .eq('id', ticketId)
        .eq('status', 'paid') // Chỉ vé đã thanh toán
        .single();

      if (error || !ticket) {
        setMessage('❌ Vé không hợp lệ hoặc chưa thanh toán');
        return;
      }

      // Kiểm tra vé đã check-in chưa
      if (ticket.checked_in) {
        setMessage('⚠️ Vé đã được check-in trước đó!');
        setTicketInfo(ticket);
        return;
      }

      // Cập nhật trạng thái check-in
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          checked_in: true, 
          checked_in_at: new Date().toISOString(),
          checked_in_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      setTicketInfo(ticket);
      setMessage('✅ Check-in thành công!');
      
    } catch (err) {
      console.error(err);
      setMessage('❌ Lỗi hệ thống, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🎬 Quét vé Check-in
        </h1>

        {/* QR Scanner */}
        <QRScanner 
          onScan={handleScan}
          onError={(err) => setMessage(err)}
        />

        {/* Loading */}
        {loading && (
          <div className="mt-4 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="mt-2">Đang xử lý...</p>
          </div>
        )}

        {/* Thông báo */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            message.includes('✅') ? 'bg-green-100 text-green-800' :
            message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Thông tin vé */}
        {ticketInfo && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-bold text-lg mb-2">Thông tin vé</h2>
            <p><strong>Phim:</strong> {ticketInfo.showtimes?.movies?.title}</p>
            <p><strong>Suất chiếu:</strong> {new Date(ticketInfo.showtimes?.start_time).toLocaleString('vi-VN')}</p>
            <p><strong>Ghế:</strong> {ticketInfo.seats?.map((s: any) => `${s.row}${s.number}`).join(', ')}</p>
            <p><strong>Trạng thái:</strong> {ticketInfo.checked_in ? 'Đã check-in' : 'Chưa check-in'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔐 Cấu hình PWA Manifest & Security

### manifest.json (quan trọng cho iOS)

```json
{
  "name": "Movie Ticket Scanner",
  "short_name": "TicketScanner",
  "start_url": "/checkin",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "permissions": ["camera"],
  "capture_links": "existing-client-navigate"
}
```

### Cấu hình HTTPS & Headers

```nginx
# nginx.conf hoặc cấu hình server
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    # Bắt buộc HTTPS cho camera API
    add_header Permissions-Policy "camera=(self)" always;
    add_header Feature-Policy "camera 'self'" always;
    
    # CORS nếu cần
    add_header Access-Control-Allow-Origin "https://your-domain.com";
    
    # Service Worker scope
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🍎 Xử lý đặc biệt cho iOS

iOS có nhiều hạn chế, bạn cần thêm xử lý đặc biệt:

### Camera Fallback cho iOS

```tsx
// hooks/useCamera.ts
import { useState, useEffect } from 'react';

export function useCamera() {
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Kiểm tra quyền camera
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(result => {
          setPermission(result.state as any);
          result.addEventListener('change', () => {
            setPermission(result.state as any);
          });
        });
    }
  }, []);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Ưu tiên camera sau
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Dừng stream ngay sau khi lấy quyền (để html5-qrcode quản lý)
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setPermission('denied');
      return false;
    }
  };

  return { permission, isIOS, requestCameraAccess };
}
```

### UI đặc biệt cho iOS

```tsx
// components/IOSScannerHelper.tsx
export function IOSScannerHelper() {
  const [showGuide, setShowGuide] = useState(true);

  if (!showGuide) return null;

  return (
    <div className="ios-guide bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">📱 Hướng dẫn cho iPhone/iPad:</h3>
      <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
        <li>Nhấn nút <strong>"Cho phép"</strong> khi được hỏi quyền camera</li>
        <li>Nếu không thấy hỏi, vào <strong>Cài đặt → Safari → Camera → Cho phép</strong></li>
        <li>Đảm bảo bạn đang dùng HTTPS (không phải HTTP)</li>
        <li>Nếu PWA đã cài đặt, xóa và cài lại sau khi cấp quyền</li>
      </ol>
      <button 
        onClick={() => setShowGuide(false)}
        className="mt-2 text-sm text-yellow-600 underline"
      >
        Đã hiểu, ẩn hướng dẫn
      </button>
    </div>
  );
}
```

---

## 🛠️ Giải pháp 2: Sử dụng Native Bridge (nếu cần ổn định hơn)

Nếu bạn cần độ tin cậy cao hơn, có thể dùng Capacitor/Cordova để wrap PWA:

```bash
# Cài Capacitor
npm install @capacitor/core @capacitor/camera @capacitor/android @capacitor/ios

# Thêm platform
npx cap add android
npx cap add ios
```

```tsx
// Sử dụng Capacitor Camera API
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function scanWithNativeCamera() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    direction: 'rear'
  });
  
  // Decode QR từ image.dataUrl bằng thư viện JS
  return image.dataUrl;
}
```

---

## ✅ Checklist Triển khai

| Yêu cầu | Chi tiết |
|---------|----------|
| **HTTPS** | Bắt buộc cho camera API |
| **Permissions-Policy** | Thêm header `camera=(self)` |
| **User Gesture** | Luôn yêu cầu click để bật camera |
| **iOS 16.4+** | Camera trong PWA chỉ hoạt động từ iOS 16.4 |
| **Android Chrome** | Hoạt động tốt với điều kiện thông thường |
| **Testing** | Test trên cả Safari iOS và Chrome Android |

Bạn đã thử giải pháp nào chưa? Nếu gặp lỗi cụ thể, hãy cho tôi biết môi trường (iOS/Android, phiên bản) và lỗi console để hỗ trợ chi tiết hơn.
