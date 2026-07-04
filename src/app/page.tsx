"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setIsSuccess(true);
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    // signInWithOAuth will redirect the page, so no need to stop loading state here
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zen-money-base">
      {/* Animated Gradient / Light Rays Background */}
      <div className="absolute inset-0 z-0 bg-[#09090b]">
        {/* Colorful glowing orbs for liquid glass effect */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.7, 0.5],
            rotate: [0, 90, 0],
            x: ["-10%", "10%", "-10%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.4)_0%,rgba(0,0,0,0)_70%)] blur-[80px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
            rotate: [0, -90, 0],
            y: ["10%", "-10%", "10%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.4)_0%,rgba(0,0,0,0)_70%)] blur-[80px]"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            x: ["10%", "-10%", "10%"],
            y: ["-10%", "10%", "-10%"],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.3)_0%,rgba(0,0,0,0)_70%)] blur-[80px]"
        />
        
        {/* Subtle noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="text-center mb-10">
            <h1 className="text-5xl font-semibold tracking-tight text-white mb-3 drop-shadow-md">
              Zen Money
            </h1>
            <p className="text-lg text-white/70">
              Quiet your spending. Track your runway.
            </p>
          </div>

          <Card className="relative overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl">
            {/* Glossy top edge highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <CardHeader className="pt-8">
              <CardTitle className="text-2xl text-white font-medium text-center">Welcome back</CardTitle>
              <CardDescription className="text-white/60 text-center">
                Enter your email to sign in or create an account. No passwords required.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-money-positive/10 text-money-positive p-4 rounded-xl border border-money-positive/20 text-center"
                >
                  <p className="font-medium">Check your inbox!</p>
                  <p className="text-sm mt-1 opacity-90">We sent a magic link to {email}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80 ml-1">Email address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:bg-black/30 rounded-xl transition-all"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-money-negative">{error}</p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full relative group overflow-hidden bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl h-12 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    disabled={isLoading}
                  >
                    {/* Hover light sweep effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    
                    <span className="relative flex items-center justify-center font-medium">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending magic link...
                        </>
                      ) : (
                        "Continue with Email"
                      )}
                    </span>
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#09090b] px-3 text-white/50 rounded-full border border-white/5">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-black/20 hover:bg-white/10 border-white/10 text-white rounded-xl h-12 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] font-medium"
                    disabled={isLoading}
                    onClick={handleGoogleLogin}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Google
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
