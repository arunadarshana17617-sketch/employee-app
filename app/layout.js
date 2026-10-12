// Load the global styles for the whole app
import "./globals.css";

// Page title shown in the browser tab
export const metadata = {
  title: "Employee Registry",
  description: "Add, edit and delete employee details",
};

// Root layout: wraps every page in the app
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}