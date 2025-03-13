// app/(auth)/layout.js
import "../../styles/globals.css"; 

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">{children}</main>
    </div>
  );
}
