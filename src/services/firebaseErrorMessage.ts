// src/services/firebaseErrorMessage.ts
export function firebaseErrorMessage(err: unknown): string {
  const fallback = "Something went wrong. Please try again.";

  if (!err || typeof err !== "object") return fallback;

  const anyErr = err as { code?: string; message?: string };
  const code = anyErr.code ?? "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found for that email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "That email is already in use. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    // Google popup related
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/cancelled-popup-request":
      return "Another sign-in popup is already open. Please close it and try again.";

    default:
      return anyErr.message || fallback;
  }
}