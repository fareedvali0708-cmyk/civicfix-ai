/**
 * Main layout wrapper.
 * Will include Navbar, Sidebar, and Footer once those components are built.
 * For now it renders children within a full-height container.
 */
export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar will be inserted here in the UI step */}
      <main className="flex-1">
        {children}
      </main>
      {/* Footer will be inserted here in the UI step */}
    </div>
  );
}
