/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Printer, QrCode, Layout, Info, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PaymentItem {
  id: string;
  name: string;
  amount: number;
}

export default function App() {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [lineLink, setLineLink] = useState('');
  const [items, setItems] = useState<PaymentItem[]>([
    { id: `item-${Date.now()}`, name: '', amount: 0 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const envelopeRef = useRef<HTMLDivElement>(null);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  const addItem = () => {
    setItems([...items, { id: `item-${Date.now()}-${Math.random()}`, name: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof PaymentItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDownloadPDF = async () => {
    if (!envelopeRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(envelopeRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Envelope size: 100mm x 200mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 200]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 100, 200);
      pdf.save(`創想天地收費袋_${className}_${name}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF 生成失敗，請稍後再試。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Use a more reliable QR code service
  const qrCodeUrl = lineLink.trim() 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(lineLink.trim())}`
    : '';

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Form Section */}
        <div className="no-print space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight">收費袋資訊生成工具</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">班級</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="例如：三年二班"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="請輸入姓名"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-stone-600">LINE 群組連結</label>
              <input
                type="url"
                value={lineLink}
                onChange={(e) => setLineLink(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="https://line.me/..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">收費品項</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> 新增品項
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder={`品項 ${index + 1}`}
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="金額"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-2 text-stone-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            <div className="text-stone-600">
              合計金額：<span className="text-2xl font-bold text-stone-900">NT$ {totalAmount.toLocaleString()}</span>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-emerald-200"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isGenerating ? '正在生成 PDF...' : '下載 PDF 收費袋'}
            </button>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl flex gap-3 text-sm text-stone-500">
            <Info className="w-5 h-5 flex-shrink-0 text-stone-400" />
            <p>
              提示：列印時請確認紙張大小，並在列印設定中勾選「背景圖形」以獲得最佳效果。收費袋尺寸設計為 10x20 cm。
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center">
          <div className="no-print mb-4 flex items-center gap-2 text-stone-500 font-medium">
            <QrCode className="w-5 h-5" /> 實體預覽 (10x20 cm)
          </div>
          
          <div 
            ref={envelopeRef}
            id="envelope-preview"
            style={{ 
              backgroundColor: '#ffffff',
              width: '10cm',
              height: '20cm',
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid #e7e5e4'
            }}
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h2 style={{ borderBottom: '2px solid #000000' }} className="text-2xl font-bold tracking-widest pb-2 inline-block">
                創想天地收費袋
              </h2>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 mb-8 text-lg">
              <div style={{ borderBottom: '1px solid #d6d3d1' }} className="flex pb-1">
                <span className="font-bold w-20">班級：</span>
                <span className="flex-1">{className || '________________'}</span>
              </div>
              <div style={{ borderBottom: '1px solid #d6d3d1' }} className="flex pb-1">
                <span className="font-bold w-20">姓名：</span>
                <span className="flex-1">{name || '________________'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '2px solid #000000' }}>
                    <th className="text-left py-2 font-bold">收費品項</th>
                    <th className="text-right py-2 font-bold">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e7e5e4' }}>
                      <td style={{ color: '#44403c' }} className="py-2">
                        {item.name || `品項 ${idx + 1}`}
                      </td>
                      <td className="py-2 text-right font-mono">
                        $ {Number(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Fill empty rows to maintain structure if few items */}
                  {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                    <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #f5f5f4' }}>
                      <td className="py-2 text-transparent">.</td>
                      <td className="py-2 text-transparent">.</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-4 font-bold text-xl">總計金額</td>
                    <td style={{ borderBottom: '4px double #000000' }} className="py-4 text-right font-bold text-2xl">
                      $ {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bank Info and QR Codes */}
            <div style={{ borderTop: '2px solid #e7e5e4' }} className="mt-auto pt-4">
              <div className="text-center mb-4 space-y-1">
                <p className="text-sm font-bold">可轉帳繳費 (013 國泰世華)</p>
                <p style={{ backgroundColor: '#f5f5f4' }} className="text-base font-mono font-bold py-1 rounded tracking-wider">272035017798 語創有限公司</p>
                <p style={{ color: '#57534e' }} className="text-[10px]">截圖繳費完成畫面，至官方Line確認繳費</p>
              </div>

              <div className="flex justify-around items-end">
                {/* Group QR */}
                {qrCodeUrl ? (
                  <div className="text-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="Line Group QR Code" 
                      style={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4' }}
                      className="w-20 h-20 p-1"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[10px] mt-1 font-bold">LINE親師交流群</p>
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #e7e5e4', color: '#d6d3d1' }} className="w-20 h-20 flex items-center justify-center text-[10px]">
                    親師群 QR
                  </div>
                )}

                {/* Official LINE QR */}
                <div className="text-center">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Flin.ee%2FxfMEuhv" 
                    alt="Official Line QR Code" 
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4' }}
                    className="w-20 h-20 p-1"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[10px] mt-1 font-bold">官方 LINE</p>
                </div>
              </div>
            </div>

            <div style={{ color: '#d6d3d1' }} className="text-[8px] absolute bottom-1 left-2">
              Generated by Payment Tool
            </div>

            {/* Decorative elements to look like an envelope */}
            <div style={{ backgroundColor: '#f5f5f4' }} className="absolute top-0 left-0 w-full h-1"></div>
            <div style={{ backgroundColor: '#f5f5f4' }} className="absolute bottom-0 left-0 w-full h-1"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
