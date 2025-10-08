
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [signup, setSignup] = useState(false);
	const [loginType, setLoginType] = useState<'user'|'admin'>('user');
	const navigate = useNavigate();

	const ADMIN_ID = "admin";
	const ADMIN_PASS = "admin123";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!username || !password) {
			setError("Please enter username and password");
			return;
		}
		if (loginType === 'admin') {
			// Admin login with proper JWT token
			if (username !== ADMIN_ID || password !== ADMIN_PASS) {
				setError("Invalid admin credentials");
				return;
			}
			try {
				const form = new URLSearchParams();
				form.append("username", username);
				form.append("password", password);
				const res = await fetch("http://localhost:8000/auth/admin/token", {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: form.toString()
				});
				if (!res.ok) {
					setError("Invalid admin credentials");
					return;
				}
				const data = await res.json();
				localStorage.setItem("jwt_token", data.access_token);
				navigate("/admin");
			} catch {
				setError("Admin login failed. Try again.");
			}
			return;
		}
		if (signup) {
			// Signup flow
			try {
				const res = await fetch("http://localhost:8000/auth/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username, password })
				});
				if (!res.ok) {
					const data = await res.json();
					setError(data.detail || "Signup failed");
					return;
				}
				setSignup(false);
				setError("Signup successful! Please login.");
			} catch {
				setError("Signup failed. Try again.");
			}
			return;
		}
		// User login flow
		try {
			const form = new URLSearchParams();
			form.append("username", username);
			form.append("password", password);
			const res = await fetch("http://localhost:8000/auth/token", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: form.toString()
			});
			if (!res.ok) {
				setError("Invalid credentials");
				return;
			}
			const data = await res.json();
			localStorage.setItem("jwt_token", data.access_token);
			navigate("/user");
		} catch {
			setError("Login failed. Try again.");
		}
	};

		return (
			<div className="login-bg">
				<div className="login-container">
					<h2 className="login-title">{signup ? "Sign Up" : "Sign In"}</h2>
					<form className="login-form" onSubmit={handleSubmit}>
						<div className="login-radio-group">
							<label>
								<input
									type="radio"
									name="loginType"
									value="user"
									checked={loginType === 'user'}
									onChange={() => { setLoginType('user'); setSignup(false); setError(""); }}
								/> User
							</label>
							<label>
								<input
									type="radio"
									name="loginType"
									value="admin"
									checked={loginType === 'admin'}
									onChange={() => { setLoginType('admin'); setSignup(false); setError(""); }}
								/> Admin
							</label>
						</div>
						<input
							type="text"
							placeholder="Username"
							className="login-input"
							autoComplete="username"
							value={username}
							onChange={e => setUsername(e.target.value)}
						/>
						<input
							type="password"
							placeholder="Password"
							className="login-input"
							autoComplete="current-password"
							value={password}
							onChange={e => setPassword(e.target.value)}
						/>
						{loginType === 'user' && (
							<button type="submit" className="login-btn">{signup ? "Sign Up" : "Login"}</button>
						)}
						{loginType === 'admin' && (
							<button type="submit" className="login-btn">Admin Login</button>
						)}
					</form>
					{loginType === 'user' && (
						<div style={{ marginTop: 16 }}>
							<button className="login-toggle-btn" onClick={() => { setSignup(s => !s); setError(""); }}>
								{signup ? "Already have an account? Sign In" : "New user? Sign Up"}
							</button>
						</div>
					)}
					{error && <div className="login-error">{error}</div>}
				</div>
			</div>
		);
};

export default Login;
