"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/client";
import { useAuth } from "@/hooks/UseAuth";
import MessageBox, { MessageBoxProps } from "@/components/MessageBox";
import { useRouter } from "next/navigation";


export default function OrgLoginPage() {
  const router = useRouter();
  const { auth, setAuth } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageBoxProps | null>(null);


  // Redirect to org profile if already authenticated
  useEffect(() => {
    if (auth.token) {
      router.replace("/org-profile");
    }
  }, [auth.token, router]);

  async function handleSubmit() {
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setMessage({ message: signUpError.message, messageType: "error" });
          return;
        }

        const session = data.session;
        const user = data.user;

        if (!session || !user) {
          setMessage({ message: "Check your email to confirm the account, then sign in.", messageType: "error" });
          return;
        }

        const res = await fetch("/api/orgs/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: name.trim(), email }),
        });

        const json = await res.json();

        if (!json.status) {
          setMessage({ message: json.result || "Failed to create profile", messageType: "error" });
          return;
        }

        setAuth({
          token: session.access_token,
          userId: user.id,
          email: user.email ?? email,
        });
      } else {
        const { data, error: signInError } =  await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setMessage({ message: signInError.message, messageType: "error" });
          return;
        }

        setAuth({
          token: data.session.access_token,
          userId: data.user.id,
          email: data.user.email ?? email,
        });
      }
    } catch (e) {
      setMessage({message : "Auth failed", messageType: "error" });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4 mt-8 text-center">
        {/* Heading */}
        <h1 className="text-xl font-semibold text-slate-800">
          {mode === "signin" ? "Organization Login" : "Register Organization"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === "signin"
            ? "Sign in to manage hazard reports"
            : "Create an account for your organisation"}
        </p>
      </div>

      {/* Message */}
      {message && <MessageBox {...message} />}

      {/* Form */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Organization Name
            </label>
            <input
              value={name}
              required={true}
              onChange={(e) => setName(e.target.value)}
              className="input-base w-full"
              placeholder="e.g. Road Development Authority"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            required={true}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Submitting..." :
            mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-5">
        {mode === "signin"
          ? "Don't have an account? "
          : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="text-orange-600 font-medium hover:underline"
        >
          {mode === "signin" ? "Register" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
