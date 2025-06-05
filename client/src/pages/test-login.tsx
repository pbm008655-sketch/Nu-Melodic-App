import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestLogin() {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("password");
  const [result, setResult] = useState("");

  const handleDirectLogin = async () => {
    try {
      console.log("Testing direct login...");
      
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Direct login response:", data);

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_token', data.token);
        console.log("Token stored in localStorage:", localStorage.getItem('auth_token'));
        console.log("Token stored in sessionStorage:", sessionStorage.getItem('auth_token'));
        
        // Test authenticated request
        const userResponse = await fetch("/api/user", {
          headers: {
            "Authorization": `Bearer ${data.token}`,
            "X-Auth-Token": data.token,
          },
          credentials: "include",
        });
        
        const userData = await userResponse.json();
        console.log("User data response:", userData);
        
        setResult(`Success! Token: ${data.token.substring(0, 20)}... User: ${userData.username || 'Error'}`);
      } else {
        setResult("Login failed - no token received");
      }
    } catch (error) {
      console.error("Login error:", error);
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Direct Login Test</h1>
        
        <div className="space-y-4">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="bg-zinc-800 border-zinc-700"
          />
          
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="bg-zinc-800 border-zinc-700"
          />
          
          <Button onClick={handleDirectLogin} className="w-full">
            Test Direct Login
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-zinc-800 rounded">
              <p className="text-sm">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}