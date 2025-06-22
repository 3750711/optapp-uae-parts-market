import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get("token");
    const type = searchParams.get("type");

    const verifyEmail = async () => {
      if (!tokenHash || !type) {
        setVerificationStatus("error");
        setErrorMessage("Неверные параметры верификации.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type,
        });

        if (error) {
          console.error("Ошибка верификации email:", error);
          setVerificationStatus("error");
          setErrorMessage(error.message || "Не удалось верифицировать email.");
          return;
        }

        setVerificationStatus("success");
        // Optionally, redirect after successful verification
        setTimeout(() => {
          navigate("/profile", { replace: true });
        }, 2000);
      } catch (error: any) {
        console.error("Ошибка верификации email:", error);
        setVerificationStatus("error");
        setErrorMessage(error.message || "Произошла непредвиденная ошибка.");
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Верификация Email</CardTitle>
            <CardDescription>
              {verificationStatus === "verifying" && "Подтверждаем ваш email..."}
              {verificationStatus === "success" && "Email успешно верифицирован!"}
              {verificationStatus === "error" && "Ошибка верификации email."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationStatus === "verifying" && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Верификация...</span>
              </div>
            )}

            {verificationStatus === "success" && (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Ваш email успешно верифицирован! Перенаправляем в профиль...
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus === "error" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || "Не удалось верифицировать email."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
