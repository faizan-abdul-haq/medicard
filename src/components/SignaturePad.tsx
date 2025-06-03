'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool, RotateCcw, Save, X } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  className?: string;
}

export default function SignaturePad({ label, value, onChange, className = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setHasSignature(true);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  }, [onChange]);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  }, [onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <Label>{label}</Label>
      
      {value ? (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <img src={value} alt="Saved signature" className="max-w-full h-auto border border-gray-300 rounded" />
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearSignature}>
              <X className="w-4 h-4 mr-2" />
              Remove Signature
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="border border-gray-300 rounded cursor-crosshair bg-white w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <PenTool className="w-4 h-4" />
                <span>Draw the signature above</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearSignature}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button 
              type="button" 
              onClick={saveSignature} 
              disabled={!hasSignature}
              className="bg-accent hover:bg-accent/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Signature
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
