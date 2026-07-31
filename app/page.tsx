import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import HowItWorks from "@/components/HowItWorks";
import Advantages from "@/components/Advantages";
import Comparison from "@/components/Comparison";
import Requirements from "@/components/Requirements";
import RespaldoMbeef from "@/components/RespaldoMbeef";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Advantages />
        <Comparison />
        <Requirements />
        <RespaldoMbeef />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
