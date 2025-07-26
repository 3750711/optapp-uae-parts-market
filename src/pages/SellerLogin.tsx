import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Store, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { TelegramLoginWidget } from "@/components/auth/TelegramLoginWidget";
import { devLog } from "@/utils/logger";

const SellerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithTelegram } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to your seller account.",
        });
        navigate('/seller/dashboard');
      }
    } catch (error) {
      devLog('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left side - Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  <span className="text-primary">Seller</span> Portal
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Access your seller dashboard and manage your auto parts business on PartsBay.ae
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-card">
                  <Store className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Manage Inventory</h3>
                  <p className="text-sm text-gray-600">Add and manage your auto parts listings</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-card">
                  <ShoppingBag className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-semibold mb-2">Process Orders</h3>
                  <p className="text-sm text-gray-600">Handle customer orders efficiently</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-card">
                  <Users className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Connect with Buyers</h3>
                  <p className="text-sm text-gray-600">Reach thousands of wholesale buyers</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-card">
                  <TrendingUp className="h-8 w-8 text-secondary mb-3" />
                  <h3 className="font-semibold mb-2">Grow Your Business</h3>
                  <p className="text-sm text-gray-600">Expand your market reach in UAE</p>
                </div>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md bg-white shadow-elevation border-0">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-bold">Seller Login</CardTitle>
                  <p className="text-gray-600">Enter your credentials to access your seller dashboard</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <TelegramLoginWidget
                      onSuccess={() => {
                        toast({
                          title: "Welcome back!",
                          description: "Successfully logged in with Telegram.",
                        });
                        navigate('/seller/dashboard');
                      }}
                      onError={(error) => {
                        toast({
                          title: "Telegram Login Failed",
                          description: error || "Unable to login with Telegram. Please try again.",
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-4 text-center text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="text-primary hover:underline block"
                    >
                      Forgot your password?
                    </Link>
                    
                    <div className="space-y-2">
                      <p className="text-gray-600">Don't have a seller account?</p>
                      <Link 
                        to="/seller-register" 
                        className="text-secondary hover:underline font-medium"
                      >
                        Register as a Seller
                      </Link>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-gray-600 mb-2">Looking for buyer access?</p>
                      <Link 
                        to="/login" 
                        className="text-primary hover:underline font-medium"
                      >
                        Buyer Login
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerLogin;