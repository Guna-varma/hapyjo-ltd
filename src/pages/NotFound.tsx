const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F8F5F0]">
    <div className="text-center px-6">
      <h1 className="mb-4 font-serif text-4xl font-bold text-[#2C2C2C]">404</h1>
      <p className="mb-4 text-xl text-[#2C2C2C]/80">Page not found</p>
      <a href="/" className="inline-block bg-[#0A1F44] text-[#F8F5F0] px-6 py-3 text-sm font-semibold uppercase">
        Return to Home
      </a>
    </div>
  </div>
);

export default NotFound;
