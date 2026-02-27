'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type MfaState = 'loading' | 'not_enrolled' | 'enrolling' | 'enrolled';

interface EnrollmentData {
  factorId: string;
  qrUri: string;
  secret: string;
}

export function TwoFactorCard() {
  const [state, setState] = useState<MfaState>('loading');
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(
    null,
  );
  const [verifyCode, setVerifyCode] = useState('');
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMfaStatus = useCallback(async () => {
    setState('loading');
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      toast.error('Failed to load 2FA status');
      setState('not_enrolled');
      return;
    }

    const verifiedTotpFactor = data.totp.find(
      (f) => f.status === 'verified',
    );

    if (verifiedTotpFactor) {
      setEnrolledFactorId(verifiedTotpFactor.id);
      setState('enrolled');
    } else {
      setState('not_enrolled');
    }
  }, []);

  useEffect(() => {
    loadMfaStatus();
  }, [loadMfaStatus]);

  const startEnrollment = async () => {
    setIsSubmitting(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEnrollmentData({
      factorId: data.id,
      qrUri: data.totp.uri,
      secret: data.totp.secret,
    });
    setState('enrolling');
  };

  const verifyEnrollment = async () => {
    if (!enrollmentData || verifyCode.length !== 6) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId,
      });

    if (challengeError) {
      toast.error(challengeError.message);
      setIsSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollmentData.factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });

    setIsSubmitting(false);

    if (verifyError) {
      toast.error('Invalid code. Please try again.');
      setVerifyCode('');
      return;
    }

    toast.success('Two-factor authentication enabled');
    setEnrolledFactorId(enrollmentData.factorId);
    setEnrollmentData(null);
    setVerifyCode('');
    setState('enrolled');
  };

  const cancelEnrollment = async () => {
    if (enrollmentData) {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId: enrollmentData.factorId });
    }
    setEnrollmentData(null);
    setVerifyCode('');
    setState('not_enrolled');
  };

  const disable2FA = async () => {
    if (!enrolledFactorId) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: enrolledFactorId,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Two-factor authentication disabled');
    setEnrolledFactorId(null);
    setState('not_enrolled');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security with a TOTP authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state === 'loading' && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {state === 'not_enrolled' && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">2FA is not enabled</p>
              <p className="text-sm text-muted-foreground">
                Protect your account with a time-based one-time password.
              </p>
            </div>
            <Button onClick={startEnrollment} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Enable 2FA
            </Button>
          </div>
        )}

        {state === 'enrolling' && enrollmentData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google
              Authenticator, Authy, 1Password, etc.), then enter the 6-digit
              code below to verify.
            </p>

            <div className="flex justify-center rounded-lg border bg-white p-4">
              <QRCodeSVG value={enrollmentData.qrUri} size={200} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Manual entry key
              </Label>
              <code className="block rounded bg-muted px-3 py-2 text-xs font-mono break-all select-all">
                {enrollmentData.secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEnrollment}
              >
                Cancel
              </Button>
              <Button
                onClick={verifyEnrollment}
                disabled={verifyCode.length !== 6 || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Verify & Enable
              </Button>
            </div>
          </div>
        )}

        {state === 'enrolled' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-green-600" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">2FA is enabled</p>
                <p className="text-sm text-muted-foreground">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={disable2FA}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ShieldOff className="mr-2 size-4" />
              )}
              Disable
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
