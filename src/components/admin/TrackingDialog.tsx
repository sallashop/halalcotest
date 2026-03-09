import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_RECEIPT_SIZE = 50 * 1024; // 50KB

interface TrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  isAr: boolean;
  onSave: (orderId: string, trackingNumber: string, receiptUrl: string) => void;
  isSaving: boolean;
}

const TrackingDialog = ({ open, onOpenChange, orderId, isAr, onSave, isSaving }: TrackingDialogProps) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.size > MAX_RECEIPT_SIZE) {
      toast.error(isAr ? 'حجم الصورة يجب أن يكون أقل من 50KB' : 'Image must be under 50KB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${orderId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('tracking-receipts').upload(path, file);
    if (error) {
      toast.error(isAr ? 'خطأ في رفع الصورة' : 'Upload error');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('tracking-receipts').getPublicUrl(path);
    setReceiptUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!trackingNumber.trim()) {
      toast.error(isAr ? 'أدخل رقم الشحنة' : 'Enter tracking number');
      return;
    }
    onSave(orderId, trackingNumber.trim(), receiptUrl);
    setTrackingNumber('');
    setReceiptUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {isAr ? 'بيانات تتبع الشحن' : 'Shipping Tracking Info'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="text-xs">{isAr ? 'رقم الشحنة *' : 'Tracking Number *'}</Label>
            <Input
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              className="mt-1 bg-background border-border"
              placeholder={isAr ? 'أدخل رقم تتبع الشحنة' : 'Enter tracking number'}
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-xs">{isAr ? 'إيصال الشحن (اختياري - حد أقصى 50KB)' : 'Shipping Receipt (optional - max 50KB)'}</Label>
            <div className="mt-2">
              {receiptUrl ? (
                <div className="relative inline-block">
                  <img src={receiptUrl} alt="receipt" className="h-24 rounded-lg border border-border object-cover" />
                  <button
                    onClick={() => setReceiptUrl('')}
                    className="absolute -top-2 -end-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                >
                  {uploading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-primary text-primary-foreground">
            {isAr ? 'تأكيد الشحن' : 'Confirm Shipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrackingDialog;
