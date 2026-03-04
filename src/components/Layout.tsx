import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5F0] to-background">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
