import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { OTPInput } from "../ui/otp-input";
import { ArrowLeft, Mail, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export function LoginButton() {
  const { sendOTP, verifyOTP, isLoading } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const result = await sendOTP(email);

    if (result.success) {
      setStep("otp");
      setResendTimer(60); // Start 60-second countdown
      toast.success("Verification code sent to your email");
    } else {
      toast.error(result.error || "Failed to send verification code");
    }

    setIsSubmitting(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsSubmitting(true);

    const result = await verifyOTP(email, otp);

    if (!result.success) {
      toast.error(result.error || "Invalid verification code");
    } else {
      toast.success("Successfully logged in!");
    }

    setIsSubmitting(false);
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setResendTimer(0);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsSubmitting(true);

    const result = await sendOTP(email);

    if (result.success) {
      setResendTimer(60);
      toast.success("Verification code resent to your email");
    } else {
      toast.error(result.error || "Failed to resend verification code");
    }

    setIsSubmitting(false);
  };

  // Timer effect for resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {step === "email" ? (
        <div className="space-y-6">
          {/* Header */}

          {/* Email Form */}
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium">
                Continue with email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full h-12 text-base font-semibold bg-neutral-600 hover:bg-neutral-700"
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </div>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToEmail}
              className="cursor-pointer flex items-center gap-2 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Use a different email
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter the OTP send to the email
              </p>
              <p className="text-sm font-medium text-blue-600">{email}</p>
            </div>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Enter OTP</Label>
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={isSubmitting}
                className="justify-center"
              />
            </div>

            {/* Resend Timer */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  Resend in {resendTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isSubmitting}
                  className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verifying...
                </div>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
