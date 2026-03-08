import { Footer } from "@/components/Footer";
import { LandingPage } from "@/components/LandingPage";
import {LandingPageHeader} from "@/components/LandingPageHeader";
import { Navbar } from "@/components/Navbar";
import { PostList } from "@/components/PostList";

export default function HomePage() {
  return (
    <div> 
      {/* <Navbar /> */}
      {/* <LandingPageHeader
                  items={[
                    { title: "Home", href: "/" },
                    { title: "Criar (provisório)", href: "/posts/new" },
                    // { title: "Features", href: "/#features" },
                    // { title: "Pricing", href: "/#pricing" },
                    // { title: "Github", href: "https://github.com/stack-auth/stack-template", external: true },
                  ]}
                />
      <PostList /> */}
      <LandingPage />
      {/* <Footer /> */}
    </div>
  );
}