import { Layout } from "@/components/Layout";
import HomeHeader from "@/components/HomeHeader";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import Rentals from "@/components/Rentals";
import Industries from "@/components/Industries";
import WhyChoose from "@/components/WhyChoose";
import Trust from "@/components/Trust";
import Blog from "@/components/Blog";
import GalleryCTA from "@/components/GalleryCTA";
import Contact from "@/components/Contact";

export default function HomePage() {
  return (
    <Layout>
      <HomeHeader />
      <About />
      <Stats />
      <Services />
      <Rentals />
      <Industries />
      <WhyChoose />
      <Trust />
      <Blog />
      <GalleryCTA />
      <Contact />
    </Layout>
  );
}
